---
title: 'Using Entity Framework Core? Tag Your Queries!'
date: '2022-04-12'
summary: 'If you''re using Entity Framework Core, you should be tagging your queries to help with troubleshooting both in application logs and at the Database layer. We''ll explore how to do that in this post.'
tags: 'dotnet, entity framework core'
headerImage: '/images/blog-header/logging-generated-sql-in-entity-framework-and-core.png'
---

## Query Tagging

[Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) is an incredibly flexible tool that can abstract a significant part of our database access away. However, we still need to be concerned with performance tuning and tracing. Oftentimes, the DBA team will come to the Development team asking about a specific query, usually when it's performing poorly, or the Development team might ask the DBA team about improving the performance of a specific query. Wouldn't it be great to have a way to easily track down the queries that are coming from your application?

### Enter `.TagWith()`

Starting with EF Core 2.2, you can add [`.TagWith()`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.entityframeworkqueryableextensions.tagwith?view=efcore-6.0) to your LINQ statement, like so:

```c#
return await this._dbContext
    .Minifigs
    .TagWith(nameof(GetAll))
    .Select(m => new Minifig(m.MinifigNumber, m.MinifigName, m.NumberOfParts))
    .ToListAsync();
```

In this case, the name of the method will get added to the query in the form of a comment at the top:

<img class="blog-image" src="/images/inline-blog/entity-framework-core-tag-with.png" alt="Entity Framework Core .TagWith() Generated SQL" />

You can add what ever `string` you like as an argument for `.TagWith()`, and you can even add multiple calls to `.TagWith()` to include additional data, which can be very useful in conditional query scenarios. Now, you can easily search in your logs and in your database's specific query store for those queries!

### What About `.TagWithCallSite()`?

If you are using EF Core 6.x, there is an additional extension method that provides some great information. By adding [`.TagWithCallSite()`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.entityframeworkqueryableextensions.tagwithcallsite?view=efcore-6.0), the query will get tagged with the source file name and line where the method was called from:

```c#
return await this._dbContext
    .Minifigs
    .TagWith(nameof(GetAll))
    .TagWithCallSite()
    .Select(m => new Minifig(m.MinifigNumber, m.MinifigName, m.NumberOfParts))
    .ToListAsync();
```

Which produces:

<img class="blog-image" src="/images/inline-blog/entity-framework-core-tag-with-call-site.png" alt="Entity Framework Core .TagWithCallSite() Generated SQL" />

This is fantastic! Now I know exactly where in my code the query is being generated from, which is very useful in debugging and tracing scenarios.

### Conclusion

If you're using Entity Framework Core 2.2 or greater, tag your queries with `.TagWith()`. If you're using EF Core 6.0 or greater, add `.TagWithCallSite()`. Future you (and your team and the DBA team) will thank you!
