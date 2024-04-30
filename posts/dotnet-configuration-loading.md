---
title: 'Loading Configuration in Dotnet - Order Does Matter, Just Not How You Might Expect'
date: '2024-04-30'
summary: 'Loading configuration in modern dotnet is easy, and incredibly automated, but loading custom files doesn''t always work the way you would expect, which can lead to interesting bugs.'
tags: 'dotnet, configuration'
headerImage: '/images/blog-header/dotnet-logo.png'
---

## Loading Configuration
### The Standard Setup

By now, most of us are familiar with the basics of bootstrapping a .NET 8 application. If you create a new .NET 8 API project, you will get boilerplate code that looks like this in your `Program.cs` file:

```c#
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
```

The `WebApplication.CreateBuilder(args)` method hides a lot wiring things up under the covers, including loading configuration into the DI container for use by services. And, honestly, this is great, and a vast improvement over the old method(s) of loading configuration we had to use in the .NET Framework days. Microsoft has even [documented the load order](https://learn.microsoft.com/en-us/dotnet/core/extensions/generic-host?tabs=appbuilder#host-builder-settings), which matches what you would expect:

1. `appsettings.json`
2. Environment-specific `appsettings.<environment>.json` file, using the `ASPNETCORE_ENVIRONMENT` environment variable defined on the host
3. Secret Manager (when running in the `Development` environment)
4. Environment variables from the host, substituting `__` for level nesting in JSON
5. Command line arguments, using the same substitution as in we have for Environment variables

Each subsequent configuration source in the load order can override settings that were loaded before it. For example, you might configuration your logging globally in the `appsettings.json` file and then override the default level in your `appsettings.<environment>.json` file to make sure you are only logging errors in production, but debug messages in development. Finally, you might change the environment variable on one deployment in production (and restart the service) to troubleshoot some temporary issue.

### Custom Configuration

We are not limited to only the configuration loaded by default. We might want to separate our configuration into logical chunks, rather than one large file. We might want to load secrets from files mounted in volumes to our containers to avoid exposing them as Environment variables.

The good news is that we can add any number of custom configurations. We just have to add some code to do that, like the following:

```c#
var config = new ConfigurationBuilder().AddJsonFile("appsettings.Override.json").Build();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddConfiguration(config);

// Rest of builder registrations skipped

var app = builder.Build();

// Rest of Program.cs skipped
```

In addition to JSON files, we can also add XML, key per file, and many others (as outlined [here](https://learn.microsoft.com/en-us/dotnet/core/extensions/configuration-providers)).

### The Confusing Bit

Now, as you might have gathered from the code sample above, there is something odd going on with the load order.

Our `appsettings.Override.json` has the following content:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Error"
    }
  },
  "AllowedHosts": "*",
  "ASPNETCORE_ENVIRONMENT": "Test"
}
```

When we start the application, knowing the loading order and that the value of the `ASPNETCORE_ENVIRONMENT` environment variable is `Development`, what would you expect the value of `ASPNETCORE_ENVIRONMENT` to be after we finish loading all the configuration?

If you said `Test`, you would be right, and you win a cookie. If you said anything else, well, you are making an assumption about how all this works, and you know what they say about assumptions.

### But Why?

This behavior might seem a bit strange, but it is important to remember a key part of configuring pipelines in modern dotnet - _order matters_.

So, in this case, you have an already established pipeline, as defined by the `WebApplication.CreateBuilder(args)` method call. Thus, when you add a new configuration pipeline, in this case defined on the first line, it _adds_ it to the existing pipeline, rather than replacing the pipeline you had already.

This is probably not the behavior you expected, and it can lead to unexpected configuration values being used in your running application.

### What To Do?

So, how do you control this?

There are two options:
1. Fully define your configuration pipeline to load things in the order you want, which will be explicit in the code.
2. Understand that configurations loaded after the default pipeline will override values, and plan accordingly.

The right choice for you is the one that works best with your workflow and company culture!
