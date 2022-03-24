using System;

namespace provider.Domain.Models;

public class LinkLocation
{
	public string Location { get; set; }
	public string Origin { get; set; }
	public string LinkName { get; set; }
	public uint Nonce { get; set; }
	public LinkOrigin LinkOrigin { get; set; }
	/// <summary>
	/// Can be more than one if owned by a multisig group
	/// </summary>
	/// <value></value>
	public List<LinkOwner> Owners { get; set; }
}
