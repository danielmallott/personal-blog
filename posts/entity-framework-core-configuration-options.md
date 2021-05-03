---
title: 'Entity Framework Core Configuration Options'
date: '2019-07-15'
summary: 'Entity Framework Core offers a ton of configuration options that are not immediately visible. In this post, I explore some of the most useful.'
tags: 'dotnet, entity framework, entity framework core'
headerImage: '/images/blog-header/logging-generated-sql-in-entity-framework-and-core.png'
---

## Entity Framework Core Configuration Options

[Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) offers plenty of configuration options to use when registering your DbContext with the Dependency Injection framework. These options can be used to control various behaviors of Entity Framework Core, from logging detailed exceptions to throwing exceptions when a query is evaluated on the client instead of in the database.

We'll walk through the most useful configuration options for Entity Framework Core one by one.

### Configure Warnings

The `ConfigureWarnings` method is incredibly powerful and can help you avoid issues with how queries are executed as well as giving you more insight into how EF Core is actually executing your queries. Its signature looks like the following:

```c#
public virtual Microsoft.EntityFrameworkCore.DbContextOptionsBuilder ConfigureWarnings (Action<Microsoft.EntityFrameworkCore.Diagnostics.WarningsConfigurationBuilder> warningsConfigurationBuilderAction);
```

In practice, you can invoke it like the following, in this case configuring it to throw an exception when a query is evaluated client side:

```c#
services.AddDbContext<WideWorldImportersContext>(optionsAction =>
    {
        optionsAction.ConfigureWarnings(warningsAction =>
        {
            warningsAction.Throw(RelationalEventId.QueryClientEvaluationWarning);
        });
    });
```

There are four methods for the `WarningsConfigurationBuilder` as illustrated below:

```c#
services.AddDbContext<WideWorldImportersContext>(optionsAction =>
    {
        optionsAction.ConfigureWarnings(warningsAction =>
        {
            // Specifies the default behavior for any warnings. Can be Ignore, Log, or Throw.
            warningsAction.Default(WarningBehavior.Ignore);
 
            // Specifies the event or events to ignore when they are encountered.
            warningsAction.Ignore(RelationalEventId.BoolWithDefaultWarning);

            // Specifies the event or events to log when they are encountered. 
            warningsAction.Log(RelationalEventId.ValueConversionSqlLiteralWarning);

            // Specifies the event or events to throw an exception when they are encountered.
            warningsAction.Throw(RelationalEventId.QueryClientEvaluationWarning);
        }); 
    });
```

What are the events you can configure here? They are either [Core Events](https://docs.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.diagnostics.coreeventid?view=efcore-5.0) or [Relational Events](https://docs.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.diagnostics.relationaleventid?view=efcore-5.0). Core Events are generally related to the base implementation of the ORM, such as cascade deletes or value generation. Relational Events are events specifically related to Relational Databases, such as transaction usage, migration statistics, and some query statistics.

#### Should I Use These?

In general, these will probably clutter up your log way more than you would like. However, there are a couple that are worth logging or throwing an exception when working with earlier versions of Entity Framework Core:
* `RelationalEventId.QueryClientEvaluationWarning`  
   Use this to detect when a query is being evaluated client side. This is usually due to a function that EF Core cannot convert to SQL. Why is it bad? EF Core pulls more rows out of the database than it will actually end up using, which hurts performance. I like to set this to throw an exception in development and then to log in any higher environment.  
   **_Update: This is no longer logged in Entity Framework Core 3.0 and later._**
* `CoreEventId.FirstWithoutOrderByAndFilterWarning`  
   Use this to detect when your query may not produce predictable results. Verify that your query produces only one result, or that you just don't care what is coming back (in the case of an existence check, for example). I like to set this to log in all environments.  
   **_Update: This has been marked `Obsolete` in Entity Framework Core 3.0._**
* `CoreEventId.IncludeIgnoredWarning`
   Use this to detect when a requested table is not included. If you are not using the table downstream, you can remove the line of code and improve your code's cleanliness. If you are, you can investigate what is causing EF Core to ignore your include. I like to set this to log in all environments.  
   **_Update: This has been marked `Obsolete` in Entity Framework Core 3.0._**
* `CoreEventId.RowLimitingOperationWithoutOrderByWarning`
   Like our FirstWithoutOrderByAndFilterWarning above, use this to detect when your query may not produce predictable results. In this case, tracking down predictability may be more difficult, as the first few pages may look exactly the same every time. I like to set this to throw an exception in development and then to log in any higher environment.  
   **_Update: This has been marked `Obsolete` in Entity Framework Core 3.0._**

### EnableDetailedErrors

This option will provide additional detail when an exception is thrown by EF Core during data value operations. These errors are most often due to type mismatch. This option does result in slightly higher query overhead.

Invoke it like the following:

```c#
services.AddDbContext<WideWorldImportersContext>(optionsAction =>
    {
        optionsAction.EnableDetailedErrors();
    });
```

#### Should I Use This?

In development, this should always be enabled. You should not need it in a higher environment, and its performance hit renders it a sub-optimal choice for production environments.

### EnableSensitiveDataLogging

This option causes application data to be included in log messages, exceptions, etc. During development, this can be very useful for finding bad data or specific cases where the data is causing an issue. However, if you work with any sort of regulatory data (PII, HIPAA, GDPR, etc), **_use this with extreme caution!_**

Invoke it like the following:

```c#
services.AddDbContext<WideWorldImportersContext>(optionsAction =>
    {
        optionsAction.EnableSensitiveDataLogging();
    });
```

#### Should I Use This?

Can be very useful in development, as long as you make sure you are following all relevant regulations. **_Do not use in production. Ever._**

### UseLazyLoadingProxies

Pretty simple - enables lazy loading in EF Core.

Invoke it like the following:

```c#
services.AddDbContext<WideWorldImportersContext>(optionsAction =>
    {
        optionsAction.UseLazyLoadingProxies();
    });
```

#### Should I Use This?

This one is purely up to you. There are performance considerations to using lazy loading. I prefer not to use it, mainly to avoid the "N+1" query problem.

### UseQueryTrackingBehavior

This allows you to globally configure the tracking behavior of EF Core. By default, this is set to `QueryTrackingBehavior.TrackAll`, which results in EF Core providing full change tracking for all entities it creates. However, if your `DbContext` is only being used for read operations, using the `QueryTrackingBehavior.NoTracking` option may produce better performance.

Invoke it like the following:

```c#
services.AddDbContext<WideWorldImportersContext>(optionsAction =>
    {
        optionsAction.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
    });
```

#### Should I Use This?

As noted above, if you are only performing read operations (or very few operations that would require tracking), this can provide performance benefits. Otherwise, I would avoid it so that you are not littering your code with `AsTracking()` calls.

### In Conclusion

We have talked about some of the most useful configuration options for Entity Framework Core. There are additional options for configuring the Service Provider used by the framework; however, this should not generally be used. Using these options can help the performance of EF Core and can help you get more (and more useful) information during development.
