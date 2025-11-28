<script lang="ts">
	import { onMount } from 'svelte';

	// --- LÓGICA Y DATOS ---
	let stats = {
		dineroHoy: 0,
		usuariosTotales: 0,
		ventasMes: 0,
		usuariosActivosSemana: 0,
		graficoVentas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		graficoUsuarios: { total: 0, compradores: 0, sinCompras: 0, nuevosSemana: 0 },
		ticketPromedio: 0,
		tasaConversion: 0,
		timeline: [] as any[],
		topProducts: [] as any[]
	};

	let usuario = { nombre: 'Admin' };

	// Datos visuales
	let activeUsersDisplay = [
		{ label: 'Usuarios', valor: 0 },
		{ label: 'Compradores', valor: 0 },
		{ label: 'Sin Compras', valor: 0 },
		{ label: 'Nuevos', valor: 0 }
	];

	onMount(async () => {
		const userStored = localStorage.getItem('usuario');
		if (userStored) usuario = JSON.parse(userStored);

		try {
			const res = await fetch('http://localhost:4000/api/dashboard/resumen');
			if (res.ok) {
				stats = await res.json();
				const total = stats.graficoUsuarios.total || 1;
				activeUsersDisplay = [
					{ label: 'Usuarios', valor: 100 },
					{
						label: 'Compradores',
						valor: Math.round((stats.graficoUsuarios.compradores / total) * 100)
					},
					{
						label: 'Sin Compras',
						valor: Math.round((stats.graficoUsuarios.sinCompras / total) * 100)
					},
					{ label: 'Nuevos', valor: Math.min(stats.graficoUsuarios.nuevosSemana * 10, 100) }
				];
			}
		} catch (error) {
			console.error('Error API', error);
		}
	});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-PE', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	$: pathD = generateSmoothPath(stats.graficoVentas);
	function generateSmoothPath(data: number[]) {
		if (!data || data.length === 0) return '';
		const max = Math.max(...data, 100);
		const width = 500;
		const height = 200;
		const points = data.map((val, index) => {
			const x = (index / (data.length - 1 || 1)) * width;
			const y = height - (val / max) * height;
			return [x, y];
		});
		let d = `M ${points[0][0]},${points[0][1]}`;
		for (let i = 1; i < points.length; i++) {
			d += ` L ${points[i][0]},${points[i][1]}`;
		}
		return d;
	}

	function getStockColor(stock: number) {
		if (stock === 0) return 'bg-red-500';
		if (stock < 20) return 'bg-yellow-500';
		return 'bg-green-500';
	}
</script>

<div class="fixed inset-0 z-0 pointer-events-none w-full h-full overflow-hidden">
	<div
		class="absolute top-[-20%] left-[10%] w-[80vw] h-[80vw] bg-blue-900/20 rounded-full blur-[180px]"
	></div>

	<div
		class="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-600/20 rounded-full blur-[150px] mix-blend-screen"
	></div>

	<div
		class="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-900/20 rounded-full blur-[150px]"
	></div>
</div>

<div class="relative z-10 flex flex-col gap-6 pb-10 text-white w-full">
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
		<div
			class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500 flex justify-between items-center group"
		>
			<div>
				<p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ingresos Hoy</p>
				<h3 class="text-xl font-bold">S/.{Number(stats.dineroHoy).toFixed(2)}</h3>
			</div>
			<div
				class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform"
			>
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path></svg
				>
			</div>
		</div>
		<div
			class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500 flex justify-between items-center group"
		>
			<div>
				<p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
					Usuarios Totales
				</p>
				<h3 class="text-xl font-bold">{stats.usuariosTotales}</h3>
			</div>
			<div
				class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform"
			>
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
					></path></svg
				>
			</div>
		</div>
		<div
			class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500 flex justify-between items-center group"
		>
			<div>
				<p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas del Mes</p>
				<h3 class="text-xl font-bold">S/.{Number(stats.ventasMes).toFixed(2)}</h3>
			</div>
			<div
				class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform"
			>
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
					></path></svg
				>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-7 gap-6">
		<div
			class="lg:col-span-4 relative bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 overflow-hidden shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500 flex flex-col justify-between min-h-[280px]"
		>
			<div
				class="absolute right-0 top-0 w-3/4 h-full opacity-30 pointer-events-none bg-gradient-to-l from-blue-600/40 to-transparent"
			></div>
			<div class="relative z-10">
				<p class="text-gray-400 text-xs font-bold uppercase mb-2 tracking-wider">
					Panel de Control
				</p>
				<h2 class="text-3xl font-bold text-white mb-3">Hola de nuevo,<br /> {usuario.nombre}</h2>
				<p class="text-gray-400 text-sm max-w-sm leading-relaxed">
					Tu tienda está activa. Revisa las últimas transacciones y el rendimiento general.
				</p>
			</div>
			<div class="relative z-10 mt-6">
				<a
					href="/admin/products"
					class="inline-flex items-center gap-2 text-xs font-bold text-white uppercase hover:text-blue-400 transition-colors group"
				>
					Ir a Productos <svg
						class="w-3 h-3 transform group-hover:translate-x-1 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						></path></svg
					>
				</a>
			</div>
		</div>

		<div
			class="lg:col-span-3 bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500 relative overflow-hidden flex flex-col justify-between"
		>
			<h3 class="text-lg font-bold text-white mb-2">Efectividad de Ventas</h3>
			<div class="flex items-center justify-center relative h-40 my-2">
				<div class="w-32 h-32 rounded-full border-[10px] border-[#1a2035]"></div>
				<div
					class="absolute w-32 h-32 rounded-full border-[10px] border-transparent"
					style="background: conic-gradient(#0075ff 0% {stats.tasaConversion}%, transparent {stats.tasaConversion}% 100%); mask: radial-gradient(farthest-side, transparent calc(100% - 10px), #fff calc(100% - 10px));"
				></div>
				<div class="absolute bg-blue-600 rounded-full p-3 shadow-[0_0_20px_rgba(0,117,255,0.5)]">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						></path></svg
					>
				</div>
			</div>
			<div class="flex justify-between px-2 pt-4 border-t border-white/5">
				<div class="text-center">
					<p class="text-gray-400 text-[10px] uppercase font-bold mb-1">Conversión</p>
					<h4 class="text-white font-bold text-lg">{stats.tasaConversion}%</h4>
				</div>
				<div class="text-center">
					<p class="text-gray-400 text-[10px] uppercase font-bold mb-1">Ticket Prom.</p>
					<h4 class="text-white font-bold text-lg">S/.{Number(stats.ticketPromedio).toFixed(0)}</h4>
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
		<div
			class="lg:col-span-7 bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500 relative overflow-hidden"
		>
			<div class="mb-6">
				<h3 class="text-lg font-bold text-white">Tendencia de Ventas</h3>
				<p class="text-sm text-gray-400">Comportamiento mensual (Año Actual)</p>
			</div>
			<div class="relative h-[250px] w-full">
				<svg
					viewBox="0 0 500 200"
					class="w-full h-full overflow-visible"
					preserveAspectRatio="none"
				>
					<defs>
						<linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#0075ff" stop-opacity="0.4" />
							<stop offset="100%" stop-color="#0075ff" stop-opacity="0" />
						</linearGradient>
					</defs>
					<path
						d={pathD}
						fill="none"
						stroke="#0075ff"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="drop-shadow-[0_0_15px_rgba(0,117,255,0.6)]"
					/>
					<path d="{pathD} L 500,200 L 0,200 Z" fill="url(#fillGradient)" stroke="none" />
				</svg>
				<div
					class="absolute bottom-[-20px] left-0 w-full flex justify-between text-[10px] text-gray-500 px-1 uppercase font-bold"
				>
					<span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span
						>Jun</span
					><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span
						>Dic</span
					>
				</div>
			</div>
		</div>

		<div
			class="lg:col-span-5 bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500"
		>
			<div class="mb-6 h-40 flex items-end gap-3 justify-between px-2">
				{#each activeUsersDisplay as bar}
					<div class="w-full flex flex-col items-center gap-2 group h-full justify-end">
						<div
							class="w-1.5 bg-[#2d3748] rounded-full h-full relative overflow-hidden group-hover:w-2 transition-all"
						>
							<div
								class="absolute bottom-0 left-0 w-full bg-white rounded-full transition-all duration-1000 ease-out"
								style="height: {bar.valor}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<div>
				<h3 class="text-lg font-bold text-white">Análisis de Usuarios</h3>
				<p class="text-sm text-gray-400 mb-4">Actividad vs Registros</p>
				<div class="grid grid-cols-2 gap-y-4 gap-x-2">
					<div class="flex items-center gap-2">
						<div class="w-2 h-2 rounded-full bg-blue-500"></div>
						<div>
							<p class="text-[10px] text-gray-400 uppercase font-bold">Registrados</p>
							<h4 class="text-white font-bold text-sm">{stats.graficoUsuarios.total}</h4>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-2 h-2 rounded-full bg-white"></div>
						<div>
							<p class="text-[10px] text-gray-400 uppercase font-bold">Compradores</p>
							<h4 class="text-white font-bold text-sm">{stats.graficoUsuarios.compradores}</h4>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-2 h-2 rounded-full bg-gray-500"></div>
						<div>
							<p class="text-[10px] text-gray-400 uppercase font-bold">Sin Compras</p>
							<h4 class="text-white font-bold text-sm">{stats.graficoUsuarios.sinCompras}</h4>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-2 h-2 rounded-full bg-green-500"></div>
						<div>
							<p class="text-[10px] text-gray-400 uppercase font-bold">Nuevos (7d)</p>
							<h4 class="text-white font-bold text-sm">+{stats.graficoUsuarios.nuevosSemana}</h4>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div
			class="lg:col-span-2 bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500"
		>
			<h3 class="text-lg font-bold text-white mb-4">Productos Top (Stock Bajo)</h3>
			<table class="w-full text-sm">
				<thead>
					<tr class="text-left text-gray-400 uppercase text-[10px] border-b border-white/5">
						<th class="pb-2 pl-2">Producto</th><th class="pb-2">Precio</th><th class="pb-2"
							>Estado</th
						><th class="pb-2 w-1/4">Disponibilidad</th>
					</tr>
				</thead>
				<tbody>
					{#each stats.topProducts as prod}
						<tr class="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
							<td class="py-3 pl-2">
								<div class="flex flex-col">
									<span class="text-white font-bold text-xs">{prod.nombre}</span><span
										class="text-[10px] text-gray-500">{prod.categoria || 'General'}</span
									>
								</div>
							</td>
							<td class="py-3 text-white text-xs font-bold">S/.{Number(prod.precio).toFixed(2)}</td>
							<td class="py-3"
								><span
									class="text-[10px] font-bold {prod.stock < 20
										? 'text-yellow-500'
										: 'text-green-500'}"
									>{prod.stock < 20
										? prod.stock === 0
											? 'Agotado'
											: 'Bajo Stock'
										: 'En Stock'}</span
								></td
							>
							<td class="py-3"
								><div class="flex items-center gap-2">
									<span class="text-[10px] text-gray-400 font-mono w-6">{prod.stock}</span>
									<div class="w-full bg-gray-700/50 h-1 rounded-full overflow-hidden">
										<div
											class="h-full rounded-full {getStockColor(prod.stock)}"
											style="width: {Math.min(Math.max(prod.stock, 0), 100)}%"
										></div>
									</div>
								</div></td
							>
						</tr>
					{/each}
					{#if stats.topProducts.length === 0}
						<tr
							><td colspan="4" class="py-4 text-center text-xs text-gray-500"
								>No hay productos para mostrar.</td
							></tr
						>
					{/if}
				</tbody>
			</table>
		</div>

		<div
			class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(8,112,184,0.15)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500"
		>
			<h3 class="text-lg font-bold text-white mb-4">Actividad Reciente</h3>
			<div class="flex flex-col gap-5 relative pl-2">
				<div class="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-700/30"></div>
				{#each stats.timeline as item}
					<div class="flex gap-4 relative z-10 group">
						<div
							class="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[#0f172a] rounded-full border border-white/10 group-hover:border-blue-500 transition-colors"
						>
							<div
								class="w-2 h-2 rounded-full {item.tipo === 'orden'
									? 'bg-green-500'
									: 'bg-blue-500'} shadow-[0_0_10px_currentColor]"
							></div>
						</div>
						<div>
							<h4 class="text-white font-bold text-xs">{item.titulo}</h4>
							<p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
								{formatDate(item.fecha)}
							</p>
						</div>
					</div>
				{/each}
				{#if stats.timeline.length === 0}
					<p class="text-xs text-gray-500 pl-8 py-4">No hay actividad reciente.</p>
				{/if}
			</div>
		</div>
	</div>
</div>
