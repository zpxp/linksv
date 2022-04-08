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

	/// <summary>
	/// Retrieve the latest location for a given origin
	/// </summary>
	/// <param name="origin"></param>
	/// <returns></returns>
	[HttpGet("latest")]
	public async Task<IActionResult> GetLatestForOrigin([FromQuery] string origin)
	{
		var row = await link.GetLatestLocationForOrigin(origin);
		return Ok(row);
	}


	/// <summary>
	/// Retrieve the latest location for many given origin
	/// </summary>
	/// <param name="origins"></param>
	/// <returns>Map of {origins:location}</returns>
	[HttpPost("bulklatest")]
	public async Task<IActionResult> BulkGetLatestForOrigin([FromBody] List<string> origins)
	{
		var rows = await Task.WhenAll(origins.ToHashSet().Select(x => link.GetLatestLocationForOrigin(x)));
		return Ok(rows.Where(x => x != null).ToDictionary(x => x.Origin, x => x));
	}

	/// <summary>
	/// Record a link in the provider database
	/// </summary>
	/// <param name="data"></param>
	/// <returns></returns>
	[HttpPost("location")]
	public async Task<IActionResult> AddLocation([FromBody] LinkLocationContract data)
	{
		if (string.IsNullOrWhiteSpace(data.DestroyingTxid))
		{
			await link.AddLocation(data.Origin, data.Location, data.Nonce, data.LinkName, data.Owners);
		}
		else
		{
			await link.SetLinkDestroyed(data.Origin, data.DestroyingTxid);
		}
		return NoContent();
	}

	/// <summary>
	/// Record many links in the provider database
	/// </summary>
	/// <param name="data"></param>
	/// <returns></returns>
	[HttpPost("bulklocation")]
	public async Task<IActionResult> AddBulkLocation([FromBody] List<LinkLocationContract> data)
	{
		foreach (var row in data)
		{
			if (string.IsNullOrWhiteSpace(row.DestroyingTxid))
			{
				await link.AddLocation(row.Origin, row.Location, row.Nonce, row.LinkName, row.Owners);
			}
			else
			{
				await link.SetLinkDestroyed(row.Origin, row.DestroyingTxid);
			}
		}
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
	/// <summary>
	/// If set, the link was destroyed in this txid
	/// </summary>
	/// <value></value>
	public string? DestroyingTxid { get; set; }
}