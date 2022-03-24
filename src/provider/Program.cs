using provider.Domain;
using provider.Services;
using Microsoft.EntityFrameworkCore;

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
builder.Services.AddSwaggerGen();
builder.Services.MapServices();

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
builder.Services.AddDataProtection();
builder.Services.AddHttpContextAccessor();

if (settings.Network == "test")
{
	// use testnet
	KzBsv.Kz.CreateChainParams(KzBsv.KzChain.test);
}


var app = builder.Build();

// Configure the HTTP request pipeline.
// if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

using (var serviceScope = app.Services.GetService<IServiceScopeFactory>().CreateScope())
{
	// run db migration
	var context = serviceScope.ServiceProvider.GetRequiredService<LinkDatabase>();
	context.Database.Migrate();
}

app.Run();
