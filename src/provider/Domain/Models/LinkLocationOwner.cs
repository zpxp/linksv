using System;

namespace provider.Domain.Models;

/// <summary>
/// Join table
/// </summary>
public class LinkLocationOwner
{
	public string OwnerAddress { get; set; }
	public string LinkLocation { get; set; }
}
