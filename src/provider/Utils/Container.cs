using System.Reflection;
using provider.Services;

namespace Microsoft.Extensions.DependencyInjection
{
	public static class Container
	{

		public static Assembly[] AppAssemblies { get { return Assembly.GetEntryAssembly().GetReferencedAssemblies().Select(Assembly.Load).Concat(new List<Assembly> { Assembly.GetEntryAssembly() }).ToArray(); } }

		public static IServiceCollection Map(this IServiceCollection services, Func<Type, bool> predicate)
		{
			var businessLogic = AppAssemblies
				.SelectMany(x => x.DefinedTypes)
				.Where(t => !t.IsAbstract && !t.IsInterface && predicate(t));

			services.AddTypesScoped(businessLogic);

			return services;
		}

		public static IServiceCollection MapServices(this IServiceCollection services)
		{
			var businessLogic = AppAssemblies
				.SelectMany(x => x.DefinedTypes)
				.Where(t => !t.IsAbstract && !t.IsInterface && t.GetCustomAttribute<ServiceAttribute>() != null);

			services.AddTypesScoped(businessLogic);

			return services;
		}

		/// <summary>
		/// Add all specified types to the container and create a `Func<Type>` lazy factory for those types as well
		/// </summary>
		/// <param name="services"></param>
		/// <param name="types"></param>
		/// <returns></returns>
		public static IServiceCollection AddTypesScoped(this IServiceCollection services, IEnumerable<Type> types)
		{
			foreach (var type in types)
			{
				var method = typeof(Container).GetMethod(nameof(AddType), BindingFlags.Static | BindingFlags.NonPublic).MakeGenericMethod(type);
				method.Invoke(null, new object[] { type, services });
			}

			return services;
		}


		/// <summary>
		/// Add a type and a lazy factory fuction type 
		/// </summary>
		/// <typeparam name="T"></typeparam>
		private static void AddType<T>(Type type, IServiceCollection services) where T : class
		{
			if (type.GetCustomAttribute<SingletonServiceAttribute>() != null)
			{
				services.AddLazySingleton<T>();
			}
			else if (type.GetCustomAttribute<ScopedServiceAttribute>() != null)
			{
				services.AddLazyScoped<T>();
			}
			else if (type.GetCustomAttribute<TransientServiceAttribute>() != null)
			{
				services.AddLazyTransient<T>();
			}
			else
			{
				services.AddLazyScoped<T>();
			}
		}

		public static void AddLazyScoped<T>(this IServiceCollection services) where T : class
		{
			services.AddScoped<T>();
			// add lazy factory for all bl types e.g. -> Func<LogicType> 
			services.AddScoped<Func<T>>(context => () => context.GetRequiredService<T>());
		}

		public static void AddLazyTransient<T>(this IServiceCollection services) where T : class
		{
			services.AddTransient<T>();
			// add lazy factory for all bl types e.g. -> Func<LogicType> 
			services.AddTransient<Func<T>>(context => () => context.GetRequiredService<T>());
		}

		public static void AddLazySingleton<T>(this IServiceCollection services) where T : class
		{
			services.AddSingleton<T>();
			// add lazy factory for all bl types e.g. -> Func<LogicType> 
			services.AddSingleton<Func<T>>(context => () => context.GetRequiredService<T>());
		}

		public static void AddLazySingleton<T>(this IServiceCollection services, T instance) where T : class
		{
			services.AddSingleton<T>(instance);
			// add lazy factory for all bl types e.g. -> Func<LogicType> 
			services.AddSingleton<Func<T>>(context => () => context.GetRequiredService<T>());
		}


		public static void AddLazyScoped<TInterface, TImplement>(this IServiceCollection services) where TInterface : class where TImplement : class, TInterface
		{
			services.AddScoped<TInterface, TImplement>();
			// add lazy factory for all bl types e.g. -> Func<LogicType> 
			services.AddScoped<Func<TInterface>>(context => () => context.GetRequiredService<TInterface>());
		}

		public static void AddLazyTransient<TInterface, TImplement>(this IServiceCollection services) where TInterface : class where TImplement : class, TInterface
		{
			services.AddTransient<TInterface, TImplement>();
			// add lazy factory for all bl types e.g. -> Func<LogicType> 
			services.AddTransient<Func<TInterface>>(context => () => context.GetRequiredService<TInterface>());
		}

		public static void AddLazySingleton<TInterface, TImplement>(this IServiceCollection services) where TInterface : class where TImplement : class, TInterface
		{
			services.AddSingleton<TInterface, TImplement>();
			// add lazy factory for all bl types e.g. -> Func<LogicType> 
			services.AddSingleton<Func<TInterface>>(context => () => context.GetRequiredService<TInterface>());
		}

	}
}