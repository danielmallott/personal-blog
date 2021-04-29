---
title: 'Logging Generated SQL in Entity Framework (and Core)'
date: '2019-07-19'
summary: 'Curious about how to log generated SQL in Entity Framework? Take a look at this post that outlines how to do just that in Entity Framework and EF Core'
tags: 'dotnet, entity framework, entity framework core'
headerImage: '/images/blog-header/logging-generated-sql-in-entity-framework-and-core.png'
---

## Logging Generated SQL in Entity Framework (and Core)

[Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) and [Entity Framework](https://docs.microsoft.com/en-us/ef/) get a (somewhat deserved) bad rap from developers and DBAs alike for their occasionally creative approach to generating SQL, especially when faced with a complex LINQ expression. While there are a variety of reasons why Entity Framework struggles with generating SQL, as developers, it is our responsibility to check the generated SQL and at least make sure it makes sense.

Why else would we want to log the generated SQL? For one, capturing execution statistics can be very valuable for helping to understand how your queries are impacting performance. For another, capturing query text can help tune the query from the database side, whether that function is performed as part of development or later as a DBA function.

So how do we setup logging for Entity Framework? It depends on whether we are using Entity Framework or Entity Framework Core. Both have a reasonably straightforward setup, although there are key differences.

Let's start with Entity Framework.

### Entity Framework

Entity Framework allows us to attach a delegate to the `Database.Log` property of the `DbContext`, like so:

```c#
public partial class WideWorldImporters : DbContext
{
    public WideWorldImporters()
    {
        Database.Log = message => Log.Debug(message);
    }

    // Remainder of DbContext elided
}
```

In this case, we are attaching the `Log.Debug` method from [Serilog](https://serilog.net/) to the `Log` property. Now, whenever we run a query, we will get output to our logs similar to the following.

```c#
public IEnumerable<Order> GetOrders()
{
    var results = new List<Order>();

    using (var context = new WideWorldImporters())
    {
        var query = context.Orders.Take(100);

        results = query.ToList();
    }

    return results;
}
```

<img class="blog-image" src="/images/inline-blog/entity-framework-logging-output.png" alt="Entity Framework Logging Output">

As you can see, we get a pretty good set of information from Entity Framework. We get timing information, such as when the connection was opened, when the query executed, and when the query was closed. Additionally, we get the query text and how long the query took to execute, 142ms in this case.

### Entity Framework Core

With Entity Framework, we had to make our data layer aware of our specific logging framework. While this may not pose too much of a problem, it does pose challenges when it comes to unit testing and may not be ideal in all situations.

When Microsoft rewrote Entity Framework for .NET Core, creating Entity Framework Core, it applied the same abstraction principle as in other parts of the new framework. Coupled with first-class Dependency Injection, we can now simply inject an interface, `ILoggerFactory`, to our `DbContext` and attach it.

```C#
public partial class WideWorldImportersContext : DbContext
{
    private readonly ILoggerFactory _loggerFactory;

    public WideWorldImportersContext(DbContextOptions dbContextOptions, ILoggerFactory loggerFactory)
        : base(dbContextOptions)
    {
        this._loggerFactory = loggerFactory;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseLoggerFactory(this._loggerFactory);
        base.OnConfiguring(optionsBuilder);
    }

    // Remainder of DbContext elided
}
```

To make it even simpler, `ILoggerFactory` is registered in the default DI container by the framework, so the only thing we have to do is register our logging framework with the logging pipeline.

Executing a similar query as above gives us the following output.

<img class="blog-image" src="/images/inline-blog/entity-framework-core-logging-output.png" alt="Entity Framework Core Logging Output">

Well, that is certainly more information! In addition to our query, which took 345ms to run, we also get feedback from the framework on possible issues, such as potential type issues and an issue with our LINQ query.

### Conclusion

In this post, we have seen how to log generated SQL from Entity Framework and Entity Framework Core. Additionally, we have seen the additional information we can log. Together, this information can be a valuable tool for helping to ensure our ORMs are not causing performance issues in our applications or databases.
