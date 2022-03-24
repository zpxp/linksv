using System;
using provider.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace provider.Domain;

public class LinkDatabase : DbContext
{
	public LinkDatabase(DbContextOptions<LinkDatabase> options) : base(options)
	{
	}

	public virtual DbSet<LinkOrigin> Origins { get; set; }
	public virtual DbSet<LinkLocation> Locations { get; set; }
	public virtual DbSet<LinkOwner> Owners { get; set; }

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		base.OnModelCreating(modelBuilder);

		modelBuilder.Entity<LinkOrigin>(e =>
		{
			e.HasKey(x => x.Origin);
			e.Property(x => x.Origin).IsRequired();

			e.HasMany(x => x.Locations)
				.WithOne(x => x.LinkOrigin)
				.HasForeignKey(x => x.Origin)
				.IsRequired();
		});


		modelBuilder.Entity<LinkLocation>(e =>
		{
			e.HasKey(x => x.Location);
			e.Property(x => x.Location).IsRequired();
			e.Property(x => x.Nonce).IsRequired();
			e.HasIndex(x => new { x.Nonce });
		});

		modelBuilder.Entity<LinkOwner>(e =>
		{
			e.HasKey(x => x.OwnerAddress);
			e.Property(x => x.OwnerAddress).IsRequired();
			e.HasMany(x => x.OwnedLinks)
				.WithMany(x => x.Owners);
		});
	}
}
