using provider.Domain;
using Microsoft.EntityFrameworkCore;
using provider.Domain.Models;

namespace provider.Services;

public class LinkService
{
	private readonly LinkDatabase db;
	private readonly ILogger<LinkService> logger;

	public LinkService(LinkDatabase db, ILogger<LinkService> logger)
	{
		this.db = db;
		this.logger = logger;
	}

	internal async Task<LinkLocation> GetLatestLocationForOrigin(string origin)
	{
		var orig = db.Locations.AsNoTracking().Where(x => x.Origin == origin);
		var row = await orig.FirstOrDefaultAsync(x => x.Nonce == orig.Max(x => x.Nonce));
		return row;
	}


	internal async Task AddOrigin(string origin)
	{
		var orig = await db.Origins.FirstOrDefaultAsync(x => x.Origin == origin);
		if (orig != null)
		{
			// already exists
			return;
		}

		db.Origins.Add(new LinkOrigin { Origin = origin });
	}

	internal async Task SetLinkDestroyed(string origin, string destroyingTxid)
	{
		// you should check that it was actually destroyed using destroyingTxid

		var orig = await db.Origins.FirstOrDefaultAsync(x => x.Origin == origin);
		if (orig != null)
		{
			orig.IsDestroyed = true;
		}
	}

	internal async Task AddLocation(string origin, string location, uint nonce, string linkName, List<string> owners)
	{
		var split = location.Split('_', 2);
		if (split.Length != 2 || !int.TryParse(split[1], out var idx) || idx < 1)
		{
			throw new Exception($"Invalid location {location}");
		}

		split = origin.Split('_', 2);
		if (split.Length != 2 || !int.TryParse(split[1], out idx) || idx < 1)
		{
			throw new Exception($"Invalid origin {origin}");
		}

		var orig = await db.Locations.Where(x => x.Origin == origin).ToListAsync();
		if (orig.Count > 0)
		{
			var exist = orig.FirstOrDefault(x => x.Location == location);
			if (exist != null)
			{
				// already exists do nothing
				return;
			}
			exist = orig.FirstOrDefault(x => x.Nonce == nonce && x.Location != location);
			if (exist != null)
			{
				logger.LogWarning($"Nonce already exists for origin {origin} but given location differs. Incoming location {location}. Existing location {exist.Location}");
				return;
			}
		}
		else
		{
			await AddOrigin(origin);
		}

		var link = new LinkLocation
		{
			LinkName = linkName,
			Origin = origin,
			Location = location,
			Nonce = nonce,
			Owners = new List<LinkOwner>()
		};

		foreach (var owner in owners)
		{
			var ownerRow = await db.Owners.FindAsync(owner);
			if (ownerRow == null)
			{
				ownerRow = new LinkOwner { OwnerAddress = owner };
				db.Owners.Add(ownerRow);
			}
			link.Owners.Add(ownerRow);
		}

		db.Locations.Add(link);
	}
}