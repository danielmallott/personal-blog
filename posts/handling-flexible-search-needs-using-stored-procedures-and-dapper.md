---
title: 'Handling Flexible Search Needs Using Stored Procedures and Dapper'
date: '2020-01-29'
summary: 'In this post, I detail how to use Stored Procedures and Dapper to handle flexible search needs in .NET and SQL Server.'
tags: 'sql server, dotnet, dapper'
headerImage: '/images/blog-header/handling-flexible-search-needs-using-stored-procedures-and-dapper.png'
---

###### Author's Note: This article originally appeared on the [PASS](https://www.pass.org) [Blog](https://www.pass.org/PASSBlog/TabId/68281/ArtMID/99177/ArticleID/764/Handling-Flexible-Search-Needs-Using-Stored-Procedures-and-Dapper.aspx) on 28-January-2020. It is reprinted here by permission.

## Introduction

Data access from applications has traditionally followed one of two routes: either using stored procedures or using ORMs. Both have their advantages and drawbacks. In this article, we look at how to handle flexible searching needs using the stored procedure approach.

## Problem

Traditionally, even systems that perform data access only through stored procedures face challenges when it comes to searching data. While simple CRUD is easy, searching on multiple fields can lead to one of several suboptimal solutions. Developers may introduce a stored procedure for each search combination – this often happens when a system evolves its search capabilities – or they may introduce branching logic to existing stored procedures or they may decide to introduce an ORM just for searching, such as Entity Framework or LINQ-to-SQL.

## Approach

So how do we avoid these issues? We combine two concepts: executing Dynamic SQL with `sp_executesql` and using Dapper as a lightweight ORM to map objects. Together, these will allow us to search using a flexible combination of terms without code or plan bloat.

## Requirements

We are building an API using .NET Core on the Wide World Importers database. We have already created model classes that mirror our database objects and have basic CRUD functions covered. We have received a request for an endpoint that will return Orders with associated Order Lines that match the following search criteria using “and” logic: Customer ID, Sales Person ID, Contact Person ID, Order Date, Expected Delivery Date, Customer Purchase Order Number, Stock Item ID, Description, Quantity, and Unit Price. Any, all, or none of those search parameters may be supplied by consumers of the API. Additionally, it should be easy to add more parameters without breaking existing code.

## Solution

### The Stored Procedure

First, we write our stored procedure. We are going to place some decently complex logic in here, so we will look at each part in turn.

The declaration of the stored procedure is as expected. Note that all parameters are optional with a default value of `NULL`. The purpose of this will be explained further down.

```sql
CREATE PROCEDURE Sales.SearchOrders
    @customerID INT = NULL
    ,@salesPersonID INT = NULL
    ,@contactPersonID INT = NULL
    ,@orderDate DATE = NULL
    ,@expectedDeliveryDate DATE = NULL
    ,@customerPurchaseOrderNumber NVARCHAR(20) = NULL
    ,@stockItemID INT = NULL
    ,@description NVARCHAR(100) = NULL
    ,@quantity INT = NULL
    ,@unitPrice DECIMAL(18,2) = NULL
AS
BEGIN
```

From here, we set up the base of our dynamic SQL statement:

```sql
DECLARE @sql NVARCHAR(MAX);

-- Set our base SQL.
-- Idea is that we want all orders and order lines that fit the criteria
SET @sql = '
        SELECT O.OrderID
            ,O.CustomerID
            ,O.SalespersonPersonID
            ,O.PickedByPersonID
            ,O.ContactPersonID
            ,O.BackorderOrderID
            ,O.OrderDate
            ,O.ExpectedDeliveryDate
            ,O.CustomerPurchaseOrderNumber
            ,O.IsUndersupplyBackordered
            ,O.Comments
            ,O.DeliveryInstructions
            ,O.InternalComments
            ,O.PickingCompletedWhen
            ,O.LastEditedBy
            ,O.LastEditedWhen
            ,OL.OrderLineID
            ,OL.OrderID
            ,OL.StockItemID
            ,OL.Description
            ,OL.PackageTypeID
            ,OL.Quantity
            ,OL.UnitPrice
            ,OL.TaxRate
            ,OL.PickedQuantity
            ,OL.PickingCompletedWhen
            ,OL.LastEditedBy
            ,OL.LastEditedWhen
        FROM Sales.Orders AS O LEFT JOIN Sales.OrderLines AS OL ON O.OrderID = OL.OrderID ';
```

Next, we add each parameter to a table variable like so:

```sql
DECLARE @whereParameters TABLE (WhereParameter VARCHAR(200) NOT NULL);

-- If supplied with a Customer ID, add that to the where parameters
IF (@customerID IS NOT NULL)
    INSERT INTO @whereParameters
    SELECT ' O.CustomerID = @customerID ';

-- Additional parameters omitted for brevity.
```

After we have checked all the parameters, we add them together to form a single where clause and add that to our base SQL statement.

```sql
-- If we have any where parameters, concatenate them and add a where clause to the
-- base SQL statement.
IF (
        SELECT COUNT(1)
        FROM @whereParameters
        ) > 0
BEGIN
    DECLARE @whereClause NVARCHAR(MAX) = '';

    SELECT @whereClause = COALESCE(@whereClause + WhereParameter + ' AND ', '')
    FROM @whereParameters;

    SET @whereClause = 'WHERE' + LEFT(@whereClause, LEN(@whereClause) - 4);
    SET @sql = @sql + @whereClause;
END;
```

We create the parameter list:

```sql
-- Declare and hydrate the parameters list.
-- Even if the particular parameter is not included in the query, we can still include it in the parameters list.
-- sp_executesql will happily ignore it.
DECLARE @params NVARCHAR(MAX);

SET @params = N'@customerID INT, @salesPersonID INT, @contactPersonID INT, @orderDate DATE,
        @expectedDeliveryDate DATE, @customerPurchaseOrderNumber NVARCHAR(20), @stockItemID INT,
        @description NVARCHAR(100), @quantity INT, @unitPrice DECIMAL(18,2)';
```

Lastly, we call `sp_executesql` using our dynamic SQL, the parameter list, and each of the parameters we passed in above.

```sql
EXEC sp_executesql @sql
    ,@params
    ,@customerID
    ,@salesPersonID
    ,@contactPersonID
    ,@orderDate
    ,@expectedDeliveryDate
    ,@customerPurchaseOrderNumber
    ,@stockItemID
    ,@description
    ,@quantity
    ,@unitPrice;
```

Because we have created fully parameterized SQL, SQL Server will create only one execution plan for each combination of parameters we pass in. Additionally, we can safely pass the NULL parameters, and `sp_executesql` will ignore those. It is even possible to pass sorting criteria and filter by other tables by adding joins dynamically. (Note: the code included in the Github repository at the end of the article also contains debug logic).

### The API

Our ASP.NET Core 3.1 application already has a connection string to our database available via configuration (and injectable using .NET Core’s built-in dependency injection framework). We also have other conveniences set up.

Our first step is to define our search model:

```c#
/// <summary>
/// Order Search Model.
/// </summary>
public class OrderSearchModel
{
    /// <summary>
    /// Customer Id to search for.
    /// </summary>
    public int? CustomerId { get; set; }

    /// <summary>
    /// Sales Person Id to search for.
    /// </summary>
    public int? SalesPersonId { get; set; }

    /// <summary>
    /// Contact Person Id to search for.
    /// </summary>
    public int? ContactPersonId { get; set; }

    /// <summary>
    /// Order Date to search for.
    /// </summary>
    public DateTime? OrderDate { get; set; }

    /// <summary>
    /// Expected Delivery Date to search for.
    /// </summary>
    public DateTime? ExpectedDeliveryDate { get; set; }

    /// <summary>
    /// Customer Purchase Order Number to search for.
    /// </summary>
    public string CustomerPurchaseOrderNumber { get; set; }

    /// <summary>
    /// Stock Item Id to search for.
    /// </summary>
    public int? StockItemId { get; set; }

    /// <summary>
    /// Description to search for.
    /// </summary>
    public string Description { get; set; }

    /// <summary>
    /// Quantity to search for.
    /// </summary>
    public int? Quantity { get; set; }

    /// <summary>
    /// Unit Price to search for.
    /// </summary>
    public decimal? UnitPrice { get; set; }
}
```

From here, we define our controller endpoint:

```c#
/// <summary>
/// Searches orders.
/// </summary>
/// <param name="searchModel">Search model.</param>
/// <returns>Found orders or <c>null</c> if none found.</returns>
[HttpGet()]
[Produces(MediaTypeNames.Application.Json)]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status204NoContent)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public ActionResult<IEnumerable<Order>> SearchOrders([FromQuery]OrderSearchModel searchModel)
{
    try
    {
        return this._orderRepository.SearchOrders(searchModel).ToList();
    }
    catch (Exception ex)
    {
        this._logger.LogError(exception: ex, message: "Error occurred.");
        return BadRequest("Error occurred.");
    }
}
```

Now, we need to define our repository method. This is a three-step process.

First, we need to create a mapper to help Dapper map the result of our stored procedure:

```c#
/// <summary>
/// Entity One to Many Mapper for use with Dapper.
/// </summary>
/// <typeparam name="TParent">Type of the Parent entity.</typeparam>
/// <typeparam name="TChild">Type of the Child entity.</typeparam>
/// <typeparam name="TParentKey">Type of the Key of the Parent entity.</typeparam>
public class EntityOneToManyMapper<TParent,TChild,TParentKey>
{
    private readonly IDictionary<TParentKey, TParent> _lookup = new Dictionary<TParentKey, TParent>();

    /// <summary>
    /// Add child action. Supplied at Mapper construction.
    /// </summary>
    public Action<TParent, TChild> AddChildAction { get; set; }

    /// <summary>
    /// Function to get the Key from the Parent. Supplied at Mapper construction.
    /// </summary>
    public Func<TParent, TParentKey> ParentKey { get; set; }

    /// <summary>
    /// Maps the row. Relies on Dapper to split the row to Parent and Child entities.
    /// </summary>
    /// <param name="parent">Parent entity.</param>
    /// <param name="child">Child entity.</param>
    /// <returns>Mapped Parent entity.</returns>
    public virtual TParent Map(TParent parent, TChild child)
    {
        var found = true;
        var primaryKey = ParentKey(parent);

        if (!_lookup.TryGetValue(primaryKey, out var entity))
        {
            _lookup.Add(primaryKey, parent);
            entity = parent;
            found = false;
        }

        AddChildAction(entity, child);

        return !found ? entity : default(TParent);
    }
}
```

Then, we add the method signature to the interface for the Order Repository:

```c#
/// <summary>
/// Interface that describes an Order Repository
/// </summary>
public interface IOrderRepository
{
    /// <summary>
    /// Searches Orders using the supplied <paramref name="searchModel"/>.
    /// </summary>
    /// <param name="searchModel">Search Model to use.</param>
    /// <returns>Found records or <c>null</c> if none found.</returns>
    IEnumerable<Order> SearchOrders(OrderSearchModel searchModel);
}
```

Last, we wire up the method inside the Order Repository. We only add parameters that have values from the API, and we create a concrete version of the mapper.

```c#
/// <summary>
/// Searches Orders using the supplied <paramref name="searchModel"/>.
/// </summary>
/// <param name="searchModel">Search Model to use.</param>
/// <returns>Found records or <c>null</c> if none found.</returns>
public IEnumerable<Order> SearchOrders(OrderSearchModel searchModel)
{
    var mapper = new EntityOneToManyMapper<Order, OrderLine, int>()
    {
        AddChildAction = (order, orderLine) =>
        {
            if (order.OrderLines == null)
            {
                order.OrderLines = new HashSet<OrderLine>();
            }

            order.OrderLines.Add(orderLine);
        },
        ParentKey = (order) => order.OrderId
    };

    var parameters = new DynamicParameters();
    if (searchModel.CustomerId.HasValue)
    {
        parameters.Add("@customerID", searchModel.CustomerId.Value);
    }

    // Additional parameter additions omitted for brevity
    using (var connection = Connection)
    {
        return connection.Query<Order, OrderLine, Order>("Sales.SearchOrders", param: parameters,
            map: mapper.Map, splitOn: "OrderLineID", commandType: CommandType.StoredProcedure).Where(result => result != null);
    }
}
```

Finally, all that is left is to build our code and test the endpoint. As it is a normal RESTful API, we can use a variety of tools to test our GET method, even using Chrome.

## Conclusion

In this article, you have learned how to leverage dynamic SQL to create a flexible stored procedure that can be called from Dapper and used for flexible search needs from a RESTful API. This method can even be extended for use with Entity Framework Core using the `FromSqlRaw` method. Using this technique allows for plan reuse and flexible searching while avoiding potentially ugly ORM-generated SQL.

## Additional Reading and Resources

* Source Code from the article: <https://github.com/danielmallott/flexible-search-with-dapper>
* Wide World Importers database: <https://github.com/microsoft/sql-server-samples/tree/master/samples/databases/wide-world-importers>
* Brent Ozar on Dynamic SQL: <https://www.brentozar.com/sql/dynamic/>
* Dapper: <https://github.com/StackExchange/Dapper>
* Entity Framework Core Raw SQL: <https://docs.microsoft.com/en-us/ef/core/querying/raw-sql>
