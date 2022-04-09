using System;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using provider.Domain;

namespace ProviderTest;

public class CustomWebApplicationFactory<TStartup>
		  : WebApplicationFactory<TStartup> where TStartup : class
{
	protected override void ConfigureWebHost(IWebHostBuilder builder)
	{
		builder.ConfigureServices(services =>
		{
			var descriptor = services.SingleOrDefault(
				d => d.ServiceType == typeof(DbContextOptions<LinkDatabase>));

			services.Remove(descriptor);

			var dbroot = new InMemoryDatabaseRoot();
			services.AddDbContext<LinkDatabase>(options =>
			{
				options.UseInMemoryDatabase("InMemoryDbForTesting", dbroot);
			});

			var sp = services.BuildServiceProvider();

			using (var scope = sp.CreateScope())
			{
				var scopedServices = scope.ServiceProvider;
				var db = scopedServices.GetRequiredService<LinkDatabase>();
				var logger = scopedServices.GetRequiredService<ILogger<CustomWebApplicationFactory<TStartup>>>();

				db.Database.EnsureCreated();
			}
		});
	}
}