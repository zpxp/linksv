using System;

namespace provider.Domain.Models;

public class LinkOwner
{
	public string OwnerAddress { get; set; }
	public List<LinkLocation> OwnedLinks { get; set; }
}
