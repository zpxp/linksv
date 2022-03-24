FROM mcr.microsoft.com/dotnet/aspnet:6.0-focal AS base
WORKDIR /app
EXPOSE 5000
RUN mkdir /volume
VOLUME [ "/volume" ]

ENV ASPNETCORE_URLS=http://+:5000

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-dotnet-configure-containers
RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app && chown -R appuser /volume
USER appuser

FROM mcr.microsoft.com/dotnet/sdk:6.0-focal AS build
WORKDIR "/build"
COPY submodules /build/submodules
WORKDIR "/build/src/"
COPY src/*/*.csproj ./
RUN ls *.csproj | sed -s 's/\.csproj//' | xargs -r -I '{}' sh -c "mkdir -p '{}' && mv '{}.csproj' '{}/'"
WORKDIR "/build"
COPY *.sln .
RUN dotnet restore
COPY src/ /build/src/
RUN dotnet build "src/provider/provider.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "src/provider/provider.csproj" -c Release -o /app/publish /p:UseAppHost=false

# FROM mcr.microsoft.com/dotnet/sdk:6.0-focal AS build
# COPY submodules /src/submodules
# WORKDIR /src
# COPY ["src/provider/provider.csproj", "src/provider/"]
# RUN dotnet restore "src/provider/provider.csproj"
# COPY . .
# WORKDIR "/src/src/provider"
# RUN dotnet build "provider.csproj" -c Release -o /app/build

# FROM build AS publish
# RUN dotnet publish "provider.csproj" -c Release -o /app/publish /p:UseAppHost=false


FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "provider.dll"]
