using Xunit;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using System.Collections.Generic;
using provider.Controllers;
using System.Net;
using System.Text;

namespace ProviderTest;

public class BasicTests
{
	private readonly CustomWebApplicationFactory<provider.Program> _factory;

	public BasicTests()
	{
		_factory = new CustomWebApplicationFactory<provider.Program>();
	}

	[Theory]
	[InlineData("/api/link/latest?origin=2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1")]
	public async Task Get_EndpointsReturnSuccessAndCorrectContentType(string url)
	{
		// Arrange
		var client = _factory.CreateClient();

		// Act
		var response = await client.GetAsync(url);

		// Assert
		Assert.Equal(response.StatusCode, HttpStatusCode.NoContent);
	}

	[Theory]
	[InlineData("/api/link/bulklatest")]
	public async Task PostBulkLatest(string url)
	{
		// Arrange
		var client = _factory.CreateClient();

		// Act
		var content = new StringContent(JsonSerializer.Serialize(new List<string> { "2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1" }), Encoding.UTF8, "application/json");
		var response = await client.PostAsync(url, content);

		// Assert
		response.EnsureSuccessStatusCode(); // Status Code 200-299
		Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType.ToString());
		var responseJson = await response.Content.ReadAsStringAsync();
		Assert.Equal(responseJson, "{}");
	}

	[Theory]
	[InlineData("/api/link/location")]
	public async Task PostLocation(string url)
	{
		// Arrange
		var client = _factory.CreateClient();

		// Act
		var content = new StringContent(JsonSerializer.Serialize(new LinkLocationContract
		{
			Location = "e28c840a46bc3a9154a4b1e8f4dd7531ad399b9b41ef7ce27f941065a23e87ba_1",
			Origin = "2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1",
			Nonce = 4,
			LinkName = "Test",
			Owners = new List<string> { "mpeRNN2saTDQbR2aC6Psu7pv6kDs9WjjP1" }
		}), Encoding.UTF8, "application/json");
		var response = await client.PostAsync(url, content);

		// Assert
		Assert.Equal(response.StatusCode, HttpStatusCode.NoContent);
	}

	[Theory]
	[InlineData("/api/link/bulklocation")]
	public async Task PostBulkLocation(string url)
	{
		// Arrange
		var client = _factory.CreateClient();

		// Act
		var content = new StringContent(JsonSerializer.Serialize(new List<LinkLocationContract> {
			new LinkLocationContract{
				Location = "e28c840a46bc3a9154a4b1e8f4dd7531ad399b9b41ef7ce27f941065a23e87ba_1",
				Origin = "2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1",
				Nonce = 4,
				LinkName = "Test",
				Owners = new List<string> { "mpeRNN2saTDQbR2aC6Psu7pv6kDs9WjjP1"}
			}
		}), Encoding.UTF8, "application/json");
		var response = await client.PostAsync(url, content);

		// Assert
		Assert.Equal(response.StatusCode, HttpStatusCode.NoContent);
	}


	[Fact]
	public async Task PostAndFetchLocation()
	{
		// Arrange
		var client = _factory.CreateClient();

		var link = new LinkLocationContract
		{
			Location = "e28c840a46bc3a9154a4b1e8f4dd7531ad399b9b41ef7ce27f941065a23e87ba_1",
			Origin = "2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1",
			Nonce = 4,
			LinkName = "Test",
			Owners = new List<string> { "mpeRNN2saTDQbR2aC6Psu7pv6kDs9WjjP1" }
		};
		// Act
		var content = new StringContent(JsonSerializer.Serialize(link), Encoding.UTF8, "application/json");
		var response = await client.PostAsync("/api/link/location", content);

		// Assert
		Assert.Equal(response.StatusCode, HttpStatusCode.NoContent);


		// Act
		var response2 = await client.GetAsync("/api/link/latest?origin=2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1");
		// Assert
		Assert.Equal(response2.StatusCode, HttpStatusCode.OK);
		var responseJson = await response2.Content.ReadAsStringAsync();
		var responseLink = JsonSerializer.Deserialize<LinkLocationContract>(responseJson, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
		Assert.Equal(link.Location, responseLink.Location);
		Assert.Equal(link.Nonce, responseLink.Nonce);
		Assert.Equal(link.Origin, responseLink.Origin);
		Assert.Equal(link.LinkName, responseLink.LinkName);
		Assert.Equal(responseLink.DestroyingTxid, null);
	}

	[Theory]
	[InlineData("/api/link/location")]
	public async Task PostLocationFork(string url)
	{
		// Arrange
		var client = _factory.CreateClient();

		// Act
		var content = new StringContent(JsonSerializer.Serialize(new LinkLocationContract
		{
			Location = "e28c840a46bc3a9154a4b1e8f4dd7531ad399b9b41ef7ce27f941065a23e87ba_1",
			Origin = "2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1",
			Nonce = 3,
			LinkName = "Test",
			ForkOf = "2bbdf2c541fd3f01df1fd0f9ac2fceb130ce9ae92b2309286f84d407648fba74_1",
			Owners = new List<string> { "mpeRNN2saTDQbR2aC6Psu7pv6kDs9WjjP1" }
		}), Encoding.UTF8, "application/json");
		var response = await client.PostAsync(url, content);

		// Assert
		Assert.Equal(response.StatusCode, HttpStatusCode.NoContent);
	}
}