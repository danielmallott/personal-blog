---
title: 'Why You Should Unit Test Your Database'
date: '2023-10-27'
summary: 'If you have business logic in your database (and you do), you should be testing that. We''ll explore how to do that with Microsoft SQL Server in this post.'
tags: 'testing, database'
headerImage: '/images/blog-header/microsoft-sql-server-logo.png'
---

## Unit Testing

Unit Testing, also known as Component Testing, is a level of software testing where individual units or components of a software system are tested. A unit is the smallest piece of code that can be logically isolated in a system. In traditional software development, we often write unit tests on _functions_ within _classes_. 

A good unit testing suite can help developers find issues early (i.e., push left), create a code contract protecting against unintended changes, ensure adherence to acceptance criteria, and provide a living documentation of how code is meant to be consumed.

However, developers often skip writing unit tests or do not create comprehensive unit test suites. Reasons for this include that they do not (necessarily) catch integration issues, realistic unit tests can be difficult to set up, and there can be significant extra development effort associated with writing unit tests.

When it comes to testing database code, we have traditionally lagged _far_ behind our application developer brethren, writing code and then doing some ad hoc testing and calling it good. The reality is we should be practicing the same rigor application developers do and testing the business logic in our databases. This business logic is often encapsulated in stored procedures, but may also be in functions, constraints, or even foreign keys. Sometimes there are complicated calculations living inside the database that are barely tested after being written. All of these things are vulnerable to schema changes or version upgrades, and the last thing we want is to get a 3:00AM page because the monthly/quarterly/yearly financial report started throwing out wrong results! Unit testing can be part of the answer to these problems!

### Good Unit Tests

Good unit tests have six key features (there may be more, but these are the ones I've chosen to focus on):
- They should be automated and able to run without developer intervention
- They should be granular and only test one branch at a time
- They should be fast and execute very quickly
- They should be isolated and only test the code that is meant to be tested
- They should be deterministic and produce the same result every time
- They should be independent and not rely on being executed in a specific order

### Basics of Unit Testing

Every unit test will have the same basic pattern:
1. (Optionally) Arrange
2. Act
3. Assert

```c#
[Fact]
public void Test_GetMessage()
{
    // Arrange
    var testName = "World";
    var expected = "Hello, World";
    var generator = new MessageGenerator();

    // Act
    var result = generator.GetMessage(testName);

    // Assert
    Assert.Equal(expected, result);
}
```

#### Arrange

In the arrange step, we set up everything needed to successfully execute the test. This includes setting up preconditions, such as functions or procedures that need to run beforehand, creating testing data, and mocking any dependencies. Why do we mock dependencies? Remember, we want to _isolate_ our tests to only the code under test, so any dependencies should return _expected_ data or status codes.

:::note{.callout .callout-info}
The Arrange step is not necessary if you can simply invoke the code under test with no setup, hence it being optional.
:::

#### Act

In the Act step, we actually invoke the code under test, using the data from the Arrange step, if needed. Just as importantly, we will record the results, as we will need to review them later in the Assert step.

:::note{.callout .callout-info}
In certain circumstances, such as testing for an error being thrown, we may not need to record the results, if our testing framework takes care of that for us.
:::

#### Assert

In the Assert step, we check to see if the results of the function or procedure match what we expected. If they do, the test passes; if not, it fails.

### Manual Unit Tests in T-SQL

Setting up unit tests in T-SQL is relatively easy, and you can adapt the simple testing you already do for your scripts.

For these examples, we'll use the Wide World Importers database provided as an example of best practices by Microsoft. You can find the setup scripts [here](http://go.microsoft.com/fwlink/?LinkID=800630).

Now, suppose you have an application that needs to insert people into the `Application.People` table, and your developers are not using an ORM, or are using something like [Dapper](https://github.com/DapperLib/Dapper). You would write a stored procedure to do this, and it might look like the following:

```sql
USE WideWorldImporters;
GO

CREATE OR ALTER PROCEDURE dbo.InsertPerson
    @fullName NVARCHAR(50),
    @preferredName NVARCHAR(50),
    @isEmployee BIT,
    @lastEditedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Perform basic validation on required field
    IF (@fullName IS NULL)
        THROW 50001, '@fullName must not be null', 1;

    DECLARE @InsertedId TABLE (InsertedID INT);
    
    -- Insert new row, capturing the new identity
    INSERT INTO Application.People
    (FullName, PreferredName, IsPermittedToLogon, IsExternalLogonProvider, IsSystemUser, IsEmployee, IsSalesperson, LastEditedBy)
    OUTPUT inserted.PersonID INTO @InsertedId
    VALUES
    (@fullName, @preferredName, 1, 0, 0, @isEmployee, 0, @lastEditedBy);

    DECLARE @result INT = (SELECT TOP (1) InsertedID FROM @InsertedId);
    RETURN @result;
END;
GO
```

Now, while this is a simple stored procedure, we will want to test it, to make sure the error is thrown and to make sure data is inserted successfully.

To test if the error is thrown, we might write something like:

```sql
EXEC dbo.InsertPerson NULL, NULL, NULL, NULL;
```

And when we execute it, we will observe the error thrown in the Results pane in SSMS or Azure Data Studio.

Similarly, for testing if the stored procedure works with valid values, we can write something like:

```sql
BEGIN TRANSACTION;
DECLARE @newPersonId INT;
EXEC @newPersonId = dbo.InsertPerson 'Test', 'TestUser', 1, 1;
SELECT * FROM Application.People WHERE PersonID = @newPersonId;
ROLLBACK;
```

This is fairly cumbersome, and not particularly automatable, although you can group all your scripts in a single folder and write some Powershell (or other scripting language) like this to run all the scripts:

```powershell
Get-ChildItem -Path ./src/Tests/WideWorldImporters -Force | ForEach-Object -Process {
    Invoke-Sqlcmd -InputFile $_.FullName -ConnectionString "Data Source=localhost;Initial Catalog=WideWorldImporters;User Id=<user id here>;Password=<password here>;TrustServerCertificate=true"
}
```

### Automating Unit Tests With tSQLt

Writing unit tests manually and managing database state is not bad for small applications or when there are few developers; however, if you scale your team(s) or start writing lots of stored procedures and functions, writing manual tests starts to become a major challenge.

Enter [tSQLt](https://tsqlt.org/)! tSQLt is an open source database unit testing framework specifically written for SQL Server. tSQLt gives us tools to help automate the _Arrange_ and _Assert_ steps, so we do not have to manually manage transactions or write complicated select statements to make sure two tabular results match.

How does it do this? tSQLt introduces a mocking framework, allowing us to replace functions, stored procedures, and tables with "fake" versions, so we can control the output or isolate our database from changes made during the test run. tSQLt also gives us convenience methods to check results in the _Assert_ step.

:::note{.callout .callout-warning}
tSQLt is _very_ opinionated about how to write T-SQL code, and you may have to chose between testability and performance. Writing componentized T-SQL is not natural to most developers, as you will see in the examples.
:::

#### Initial Setup

For these examples, we will be using the [StackOverflow2010 database](https://www.brentozar.com/archive/2015/10/how-to-download-the-stack-overflow-database-via-bittorrent/), provided by [Brent Ozar](https://twitter.com/brento).

tSQLt leverages the CLR to do its magic, and you will need to run two scripts on the server to enable it (and add the various stored procedures and functions that make it tick). These scripts are included in the download from [tSQLt](https://tsqlt.org/downloads) and you should execute `PrepareServer.sql` followed by `tSQLt.class.sql`. Be sure to be logged in with an admin user and make sure you are in the correct database.

Once you have tSQLt installed, you will need to create a Test Class, a special schema that holds tests:

```sql
USE StackOverflow;

EXEC tSQLt.NewTestClass 'SampleTests';
GO
```

#### Inserting a User

Similar to our manual example, above, lets write a simple stored procedure to encapsulate the logic around inserting a user:

```sql
USE StackOverflow;
GO

CREATE OR ALTER PROCEDURE dbo.InsertUser
    @aboutMe NVARCHAR(MAX),
    @displayName NVARCHAR(40),
    @location NVARCHAR(100),
    @websiteUrl NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    -- Perform basic validation on required field
    IF (@displayName IS NULL)
        THROW 50001, '@displayName must not be null', 1;
    
    -- Insert new row, capturing the new identity
    INSERT INTO dbo.Users
    (AboutMe, Age, CreationDate, DisplayName, DownVotes, EmailHash, LastAccessDate, [Location], Reputation, UpVotes, Views, WebsiteUrl, AccountId)
    VALUES
    (@aboutMe, NULL, GETDATE(), @displayName, 0, NULL, GETDATE(), @location, 1, 0, 0, @websiteUrl, NULL);

    RETURN SCOPE_IDENTITY();
END;
GO
```

We have a few logical branches to test, namely, if we actually got a value for `@displayName` and if all the values are good.

First, let's test the valid insert. To do so, we will create a stored procedure in our Test Class, containing the logic for the test:

```sql
CREATE OR ALTER PROCEDURE SampleTests.[Test That Data Inserts Correctly to Users Table]
AS
BEGIN
    -- Arrange
    EXEC tSQLt.FakeTable @TableName = 'dbo.Users', @Identity = 1;
    DECLARE @newUserId INT;

    -- Act
    EXEC @newUserId = dbo.InsertUser 'Test', 'Test', 'Test', 'Test';

    -- Assert
    DECLARE @countInTable INT = (SELECT COUNT(1) FROM dbo.Users);
    EXEC tSQLt.AssertEquals 1, @countInTable, 'Did not insert row';
    EXEC tSQLt.AssertEquals 1, @newUserId, 'Did not insert new Id';
END;
GO
```

What is this actually doing? Let's walk through step by step:
1. We create a fake table, using `tSQLt.FakeTable`, which copies the _schema_ of the table without the _constraints_ of the table. In this case, we are supplying `@Identity = 1` to make sure our fake table also retains its identity specification. We could further supply `@Defaults = 1` to maintain default constraints, `@ComputedColumns = 1` to maintain computed columns or call `tSQLt.ApplyConstraint` to add other constraints, like foreign keys, back to our table. In our case, this is not necessary.
2. We call our stored procedure with test values
3. We check to see if our row was inserted correctly. In this case, we are only checking the existence of the row in the table and that it got `UserID` of `1` (which it should, since it's an empty table). In more complicated cases, we might want to check the actual data that was returned, using something like `tSQLt.AssertEqualsTable` or `tSQLt.AssertResultSetsHaveSameMetaData`.

Now, to test the check on a `NULL` `@displayName` parameter, our unit test will look much simpler:

```sql
CREATE OR ALTER PROCEDURE SampleTests.[Test That Null Display Name On Insert User Throws Error]
AS
BEGIN
    -- Arrange
    EXEC tSQLt.ExpectException 
        @ExpectedMessage = '@displayName must not be null', 
        @ExpectedSeverity = NULL, 
        @ExpectedState = 1;

    -- Act
    EXEC dbo.InsertUser 'I''m a test', NULL, 'CI/CD', 'https://www.contoso.com';
END;
GO
```

In this case, we are just telling tSQLt that we expect an exception to be thrown by our code, and it handles the assertion for us, safely wrapping the call! Easy!

#### Adding a Componentized Function Call

One logic hole in our `dbo.InsertPerson` stored procedure is that we don't try to detect if the `@displayName` is in use, since those should be unique in the system. It would be quite easy to add a quick check in the stored procedure like this:

```sql
IF EXISTS (SELECT 1 FROM dbo.Users WHERE DisplayName = @displayName)
    THROW 50002, '@displayName already exists', 1;
```

However, the testability of our stored procedure suffers, because now we have to think about adding data to our fake table (or not) to be able to test various scenarios. So we should encapsulate this logic into a function, especially because it can be reused in other parts of the system:

```sql
USE StackOverflow;
GO

CREATE OR ALTER FUNCTION dbo.CheckUserDisplayNameExists(@userDisplayName NVARCHAR(40))
RETURNS BIT
AS
BEGIN
    DECLARE @result BIT;
    IF EXISTS (SELECT 1 FROM dbo.Users WHERE DisplayName = @userDisplayName)
    BEGIN
        SET @result = 1;
    END;
    ELSE
    BEGIN
        SET @result = 0;
    END;
    RETURN (@result);
END;
GO
```

And, of course, we write some unit tests for it:

```sql
USE StackOverflow;
GO

CREATE OR ALTER PROCEDURE SampleTests.[Test That Existing User Display Name Returns 1]
AS
BEGIN
    -- Arrange
    EXEC tSQLt.FakeTable @TableName = 'dbo.Users', @Identity = 1;
    INSERT INTO dbo.Users
    (AboutMe, Age, CreationDate, DisplayName, DownVotes, EmailHash, LastAccessDate, [Location], Reputation, UpVotes, Views, WebsiteUrl, AccountId)
    VALUES
    ('I''m a test', NULL, GETDATE(), 'test-display-name', 0, NULL, GETDATE(), 'CI/CD', 1, 0, 0, 'https://www.contoso.com', NULL);
    DECLARE @result INT;

    -- Act
    SET @result = (SELECT dbo.CheckUserDisplayNameExists('test-display-name'));

    -- Assert
    EXEC tSQLt.AssertEquals 1, @result, 'Did not return that User Display Name Exists';
END;
GO
```

```sql
USE StackOverflow;
GO

CREATE OR ALTER PROCEDURE SampleTests.[Test That Non-existing User Display Name Returns 0]
AS
BEGIN
    -- Arrange
    EXEC tSQLt.FakeTable @TableName = 'dbo.Users', @Identity = 1;
    DECLARE @result INT;

    -- Act
    SET @result = (SELECT dbo.CheckUserDisplayNameExists('test-display-name'));

    -- Assert
    EXEC tSQLt.AssertEquals 0, @result, 'Did not return that User Display Name Does Not Exist';
END;
GO
```

Now we can change our stored procedure to look like this:

```sql
USE StackOverflow;
GO

CREATE OR ALTER PROCEDURE dbo.InsertUser
    @aboutMe NVARCHAR(MAX),
    @displayName NVARCHAR(40),
    @location NVARCHAR(100),
    @websiteUrl NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    -- Perform basic validation on required field
    IF (@displayName IS NULL)
        THROW 50001, '@displayName must not be null', 1;

    DECLARE @displayNameExists BIT;
    SET @displayNameExists = (SELECT dbo.CheckUserDisplayNameExists(@displayName));
    IF (@displayNameExists = 1)
        THROW 50002, '@displayName already exists', 1;
    
    -- Insert new row, capturing the new identity
    INSERT INTO dbo.Users
    (AboutMe, Age, CreationDate, DisplayName, DownVotes, EmailHash, LastAccessDate, [Location], Reputation, UpVotes, Views, WebsiteUrl, AccountId)
    VALUES
    (@aboutMe, NULL, GETDATE(), @displayName, 0, NULL, GETDATE(), @location, 1, 0, 0, @websiteUrl, NULL);

    RETURN SCOPE_IDENTITY();
END;
GO
```

Is there more code now? Yes, but we can fully isolate the function call. We do this by creating fake implementations which we can use with `tSQLt.FakeFunction` to have called instead of our real function during the test run. So we will create two fake implementations, one for each case:

```sql
USE StackOverflow;
GO

CREATE OR ALTER FUNCTION SampleTests.Fake_CheckUserDisplayNameExists_DoesExist (@userDisplayName NVARCHAR(40))
RETURNS BIT
AS
BEGIN
    RETURN 1;
END;
```

```sql
USE StackOverflow;
GO

CREATE OR ALTER FUNCTION SampleTests.Fake_CheckUserDisplayNameExists_DoesNotExist (@userDisplayName NVARCHAR(40))
RETURNS BIT
AS
BEGIN
    RETURN 0;
END;
```

:::note{.callout .callout-danger}
It is _vitally important_ for the parameter names to match _exactly_, otherwise tSQLt will not be able to do the replacement properly (and it will not give you great feedback on why).
:::

We can now create a unit test using our fake function, rather than creating data in a table - much more reliable and less prone to human error!

```sql
USE StackOverflow;
GO

CREATE OR ALTER PROCEDURE SampleTests.[Test That Already Existing Display Name On Insert User Throws Error]
AS
BEGIN
    -- Arrange
    EXEC tSQLt.FakeFunction 'dbo.CheckUserDisplayNameExists', 'SampleTests.Fake_CheckUserDisplayNameExists_DoesExist';
    EXEC tSQLt.ExpectException 
        @ExpectedMessage = '@displayName already exists', 
        @ExpectedSeverity = NULL, 
        @ExpectedState = 1;

    -- Act
    EXEC dbo.InsertUser 'I''m a test', 'existing-display-name', 'CI/CD', 'https://www.contoso.com';
END;
GO
```

#### Running tSQLt Tests

For our manual tests, we threw together a bit of Powershell to help us out. Fortunately, with tSQLt, we can stay right in T-SQL. We can execute a single test like so:

```sql
EXEC tSQLt.Run @testName = 'SampleTests.[Test That Already Existing Display Name On Insert User Throws Error]';
```

We can run an entire Test Class like so:

```sql
EXEC tSQLt.Run @testName = 'SampleTests';
```

And, finally, we can run all tests in all Test Classes like so:

```sql
EXEC tSQLt.RunAll;
```

### Conclusion

We should be unit testing our database code, and we while we can write and execute those tests manually, there exists a better way - tSQLt. Unit testing does require us to write our database code in different ways, but this also makes it more reusable and more resistent to changes that could break things.

In a future blog post, I will outline how to integrate database unit testing to your CI/CD pipeline, so you can run tests every time the code changes, and not just when developers remember to.
