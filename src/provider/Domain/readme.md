
# Create migration in csproj root
dotnet ef migrations add MigrationName -s .


# To apply migrations
dotnet ef database update