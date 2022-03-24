using System;

namespace provider.Services
{
	public abstract class ServiceAttribute : System.Attribute
	{

	}

	[System.AttributeUsage(System.AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
	public sealed class SingletonServiceAttribute : ServiceAttribute
	{

	}

	[System.AttributeUsage(System.AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
	public sealed class TransientServiceAttribute : ServiceAttribute
	{

	}

	[System.AttributeUsage(System.AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
	public sealed class ScopedServiceAttribute : ServiceAttribute
	{

	}
}
