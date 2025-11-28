<script>
	// No scripts needed here
</script>

<div class="min-h-screen w-full max-w-7xl mx-auto pt-32 pb-12 px-6 flex flex-col justify-center">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
		<div class="space-y-8">
			<div
				class="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest"
			>
				Nueva Colección 2024
			</div>

			<h1 class="text-5xl md:text-7xl font-bold leading-tight text-white">
				Potencia Tu <br />
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
					Rendimiento
				</span>
			</h1>

			<p class="text-gray-400 text-lg max-w-lg leading-relaxed">
				Suplementos de calidad premium diseñados para atletas que buscan superar sus límites.
				Recuperación rápida, energía explosiva.
			</p>

			<div class="flex gap-4 pt-4">
				<a
					href="/tienda"
					class="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(0,117,255,0.4)] hover:shadow-[0_0_40px_rgba(0,117,255,0.6)] hover:bg-blue-500 transition-all hover:-translate-y-1"
				>
					Ver Productos
				</a>
				<a
					href="/nosotros"
					class="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-2xl hover:bg-white/5 transition-all"
				>
					Más Información
				</a>
			</div>
		</div>

		<div class="relative flex justify-center lg:justify-end">
			<div
				class="relative w-full max-w-md bg-[#0f172a]/60 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 group"
			>
				<div class="flex justify-between items-center mb-8">
					<div>
						<h3 class="text-gray-400 text-sm font-medium">Producto Destacado</h3>
						<p class="text-2xl font-bold text-white mt-1">Whey Gold Pro</p>
					</div>
					<div
						class="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-bold border border-green-500/20"
					>
						+15% Ventas
					</div>
				</div>

				<div class="h-48 flex items-end justify-between gap-3 px-2 mb-6">
					{#each [40, 70, 45, 90, 60, 75, 50] as height}
						<div
							class="w-full bg-blue-600 rounded-t-lg hover:bg-blue-400 transition-colors cursor-pointer relative group/bar"
							style="height: {height}%"
						>
							<div
								class="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10"
							>
								{height}% Rendimiento
							</div>
						</div>
					{/each}
				</div>

				<div class="flex items-center gap-4 pt-4 border-t border-white/10">
					<div class="h-16 w-16 rounded-xl bg-white p-1">
						<img
							src="https://media.falabella.com/falabellaPE/146170830_01/w=1500,h=1500,fit=pad"
							alt="Whey"
							class="w-full h-full object-contain rounded-lg"
						/>
					</div>
					<div>
						<p class="text-white font-bold">Stock Disponible</p>
						<p class="text-gray-400 text-sm">100 Unidades en almacén</p>
					</div>
					<div class="ml-auto text-2xl font-bold text-white">S/.50.00</div>
				</div>
			</div>
		</div>
	</div>
</div>
