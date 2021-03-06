using provider.Domain;
using provider.Services;
using Microsoft.EntityFrameworkCore;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("ProviderTests")]


var builder = WebApplication.CreateBuilder(args);

var settings = new AppSettings();
builder.Configuration.GetSection("AppSettings").Bind(settings);
var cstr = new ConnectionStrings();
builder.Configuration.GetSection("ConnectionStrings").Bind(cstr);
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));
builder.Services.Configure<ConnectionStrings>(builder.Configuration.GetSection("ConnectionStrings"));


// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
	var filePath = Path.Combine(AppContext.BaseDirectory, "provider.xml");
	c.IncludeXmlComments(filePath, includeControllerXmlComments: true);
});
builder.Services.AddScoped<LinkService>();

builder.Services.AddCors(options =>
{
	options.AddDefaultPolicy(builder =>
		{
			builder.SetIsOriginAllowed(s => true)
				.AllowCredentials()
				.AllowAnyMethod()
				.AllowAnyHeader();
		});
});

builder.Services.AddDbContext<LinkDatabase>(opts => opts.UseSqlite(cstr.LinkDbConnectionString));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || settings.ShowSwaggerDoc)
{
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

if (settings.Network == "test" && KzBsv.Kz.Chain == KzBsv.KzChain.unkown)
{
	// use testnet
	KzBsv.Kz.CreateChainParams(KzBsv.KzChain.test);
}

using (var serviceScope = app.Services.GetService<IServiceScopeFactory>().CreateScope())
{
	// run db migration
	var context = serviceScope.ServiceProvider.GetRequiredService<LinkDatabase>();
	if (context.Database.IsRelational())
	{
		context.Database.Migrate();
	}
}

app.Run();



namespace provider
{

	// expose this to allow testing with WebApplicationFactory
	public partial class Program { }
}