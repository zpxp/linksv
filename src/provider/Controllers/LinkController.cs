using System;
using provider.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace provider.Controllers;

// uncomment this to require auth. You will need to set up cookie/jwt/etc auth in the Program.cs file
// and provide a way for your client to authenticate
// [Authorize]
[ApiController]
[Route("api/link")]
public class LinkController : Controller
{
	private readonly LinkService link;

	public LinkController(LinkService link)
	{
		this.link = link;
	}


	[HttpGet("latest")]
	public async Task<IActionResult> GetLatestForOrigin([FromQuery] string origin)
	{
		var row = await link.GetLatestLocationForOrigin(origin);
		return Ok(row);
	}


	[HttpPost("bulklatest")]
	public async Task<IActionResult> BulkGetLatestForOrigin([FromBody] List<string> origins)
	{
		var rows = await Task.WhenAll(origins.ToHashSet().Select(x => link.GetLatestLocationForOrigin(x)));
		return Ok(rows.Where(x => x != null).ToDictionary(x => x.Origin, x => x));
	}

	[HttpPost("location")]
	public async Task<IActionResult> AddLocation([FromBody] LinkLocationContract data)
	{
		await link.AddLocation(data.Origin, data.Location, data.Nonce, data.LinkName, data.Owners);
		return NoContent();
	}

	[HttpPost("bulklocation")]
	public async Task<IActionResult> AddBulkLocation([FromBody] List<LinkLocationContract> data)
	{
		await Task.WhenAll(data.Select(x => link.AddLocation(x.Origin, x.Location, x.Nonce, x.LinkName, x.Owners)));
		return NoContent();
	}


	[HttpPost("origin")]
	public async Task<IActionResult> AddOrigin([FromBody] string origin)
	{
		await link.AddOrigin(origin);
		return NoContent();
	}
}


public class LinkLocationContract
{
	/// <summary>
	/// Current link location
	/// </summary>
	/// <value></value>
	public string Location { get; set; }
	/// <summary>
	/// Link origin
	/// </summary>
	/// <value></value>
	public string Origin { get; set; }
	/// <summary>
	/// Link nonce
	/// </summary>
	/// <value></value>
	public uint Nonce { get; set; }
	/// <summary>
	/// Name of link template
	/// </summary>
	/// <value></value>
	public string LinkName { get; set; }
	/// <summary>
	/// Owner address
	/// </summary>
	/// <value></value>
	public List<string> Owners { get; set; }
}