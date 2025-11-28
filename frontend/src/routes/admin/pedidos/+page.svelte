<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	// --- INTERFACES ---
	interface Sale {
		idPedido: number;
		nombreCliente: string;
		correo: string;
		telefono: string;
		direccion: string;
		total: number;
		fechaPedido: string;
		estado: string;
		productos: any; // JSON array o string
	}

	// --- ESTADO ---
	let sales: Sale[] = [];
	let isLoading = true;
	let searchTerm = '';

	// Paginación
	let currentPage = 1;
	let itemsPerPage = 10;

	// Modal Detalle
	let showModal = false;
	let selectedSale: Sale | null = null;
	let parsedProducts: any[] = [];

	// --- INICIALIZACIÓN ---
	onMount(async () => {
		await fetchSales();
	});

	async function fetchSales() {
		try {
			// ACTUALIZADO: Apunta a /api/pedidos
			const res = await fetch('http://localhost:4000/api/pedidos');
			if (res.ok) sales = await res.json();
		} catch (error) {
			console.error('Error al cargar pedidos:', error);
		} finally {
			isLoading = false;
		}
	}

	// --- ACCIONES ---

	// CANCELAR PEDIDO
	async function cancelOrder(id: number) {
		if (
			!confirm(
				'¿Estás seguro de CANCELAR este pedido? Se eliminará el envío asociado y el estado pasará a Cancelado.'
			)
		)
			return;

		try {
			// Llamada al endpoint de cancelación
			const res = await fetch(`http://localhost:4000/api/pedidos/${id}/cancel`, { method: 'PUT' });
			if (res.ok) {
				await fetchSales(); // Recargar tabla
				alert('Pedido cancelado correctamente.');
			} else {
				alert('Error al cancelar el pedido.');
			}
		} catch (e) {
			console.error(e);
			alert('Error de conexión.');
		}
	}

	// --- LÓGICA ---
	$: totalRevenue = sales.reduce((acc, sale) => {
		// No sumamos cancelados al total
		return sale.estado !== 'Cancelado' ? acc + Number(sale.total) : acc;
	}, 0);

	$: totalOrders = sales.length;

	// Filtros
	$: filteredSales = sales.filter(
		(s) =>
			(s.nombreCliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			s.idPedido.toString().includes(searchTerm) ||
			(s.correo || '').toLowerCase().includes(searchTerm)
	);

	// Paginación
	$: totalPages = Math.ceil(filteredSales.length / itemsPerPage);
	$: if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
	$: if (totalPages === 0) currentPage = 1;

	$: paginatedSales = filteredSales.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Funciones Auxiliares
	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('es-PE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function openDetails(sale: Sale) {
		selectedSale = sale;
		// Parsear productos de manera segura
		if (typeof sale.productos === 'string') {
			try {
				parsedProducts = JSON.parse(sale.productos);
			} catch (e) {
				parsedProducts = [];
			}
		} else if (Array.isArray(sale.productos)) {
			parsedProducts = sale.productos;
		} else {
			parsedProducts = [];
		}
		showModal = true;
	}

	function exportToCSV() {
		const headers = ['ID', 'Cliente', 'Fecha', 'Total', 'Estado', 'Correo'];
		const rows = filteredSales.map((s) => [
			s.idPedido,
			s.nombreCliente,
			s.fechaPedido,
			s.total,
			s.estado,
			s.correo
		]);
		const csvContent =
			'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', 'reporte_pedidos.csv');
		document.body.appendChild(link);
		link.click();
	}

	function getStatusColor(estado: string) {
		switch (estado) {
			case 'Pagado':
				return 'text-green-400 bg-green-500/20 border-green-500/20';
			case 'Pendiente':
				return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/20';
			case 'Cancelado':
				return 'text-red-400 bg-red-500/20 border-red-500/20';
			case 'Enviado':
				return 'text-blue-400 bg-blue-500/20 border-blue-500/20';
			case 'Entregado':
				return 'text-teal-400 bg-teal-500/20 border-teal-500/20';
			default:
				return 'text-gray-400 bg-gray-500/20 border-gray-500/20';
		}
	}
</script>

<div class="flex flex-col gap-8 pb-10 w-full text-white">
	<!-- 1. KPIs -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Ingresos -->
		<div
			class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.15)] flex items-center justify-between hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500"
		>
			<div>
				<p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
					Ingresos Históricos
				</p>
				<h3 class="text-2xl font-bold text-white">
					S/.{totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
				</h3>
			</div>
			<div
				class="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path></svg
				>
			</div>
		</div>

		<!-- Total Pedidos -->
		<div
			class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.15)] flex items-center justify-between hover:shadow-[0_20px_50px_rgba(8,112,184,0.3)] transition-all duration-500"
		>
			<div>
				<p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Pedidos</p>
				<h3 class="text-2xl font-bold text-white">{totalOrders}</h3>
			</div>
			<div
				class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
					></path></svg
				>
			</div>
		</div>

		<!-- Exportar -->
		<div
			class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.15)] flex flex-col justify-center items-start cursor-pointer hover:bg-[#0f172a]/90 transition group"
			on:click={exportToCSV}
		>
			<div class="flex items-center gap-3 mb-1">
				<div
					class="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						></path></svg
					>
				</div>
				<h3 class="text-lg font-bold text-white">Exportar Reporte</h3>
			</div>
			<p class="text-xs text-gray-400 pl-1">Descargar CSV de todos los pedidos</p>
		</div>
	</div>

	<!-- 2. TABLA -->
	<section
		class="bg-[#0f172a]/70 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(8,112,184,0.15)] overflow-hidden flex flex-col transition-all duration-300"
	>
		<!-- Header Tabla -->
		<div class="p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
			<div>
				<h2 class="text-lg font-bold text-white">Historial de Pedidos</h2>
				<p class="text-xs text-gray-400">Transacciones realizadas</p>
			</div>
			<div class="relative w-full sm:w-64">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/></svg
					>
				</div>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar ID, cliente, correo..."
					class="w-full bg-[#0b1437] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-white/10 focus:border-blue-500 outline-none transition-all"
				/>
			</div>
		</div>

		<!-- Cuerpo Tabla -->
		<div class="border-t border-white/5 overflow-x-auto min-h-[400px]">
			<table class="w-full">
				<thead class="bg-[#0b1437]/30 text-left">
					<tr>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
							>ID Pedido</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cliente</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center"
							>Estado</th
						>
						<th class="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right"
							>Acciones</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/5">
					{#if isLoading}
						<tr><td colspan="6" class="p-8 text-center text-gray-400">Cargando pedidos...</td></tr>
					{:else if paginatedSales.length === 0}
						<tr
							><td colspan="6" class="p-8 text-center text-gray-400">No se encontraron pedidos.</td
							></tr
						>
					{:else}
						{#each paginatedSales as sale}
							<tr class="hover:bg-white/5 transition-colors group">
								<td class="p-4 text-sm font-mono text-blue-400">#{sale.idPedido}</td>
								<td class="p-4">
									<div class="flex flex-col">
										<span class="text-sm font-bold text-white">{sale.nombreCliente}</span>
										<span class="text-[10px] text-gray-500">{sale.correo}</span>
									</div>
								</td>
								<td class="p-4 text-xs text-gray-300">{formatDate(sale.fechaPedido)}</td>
								<td class="p-4 text-sm font-bold text-white">S/.{Number(sale.total).toFixed(2)}</td>
								<td class="p-4 text-center">
									<span
										class="px-2 py-1 rounded-md border text-[10px] font-bold uppercase {getStatusColor(
											sale.estado
										)}"
									>
										{sale.estado}
									</span>
								</td>
								<td class="p-4 text-right">
									<div class="flex items-center justify-end gap-2">
										<!-- Botón Ver Detalles -->
										<button
											on:click={() => openDetails(sale)}
											class="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
											title="Ver Detalles"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												></path><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												></path></svg
											>
										</button>

										<!-- Botón CANCELAR PEDIDO (Solo si no está cancelado ni entregado) -->
										{#if sale.estado !== 'Cancelado' && sale.estado !== 'Entregado'}
											<button
												on:click={() => cancelOrder(sale.idPedido)}
												class="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10"
												title="Cancelar Pedido"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
													><path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
													></path></svg
												>
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Paginación -->
		<div
			class="p-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-400"
		>
			<span>Mostrando {paginatedSales.length} de {filteredSales.length}</span>
			<div class="flex gap-2">
				<button
					on:click={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					class="px-3 py-1 rounded-lg bg-[#0b1437] border border-white/10 hover:bg-white/5 disabled:opacity-50 transition"
					>Anterior</button
				>
				<span class="px-3 py-1 rounded-lg bg-blue-600 text-white shadow-lg">{currentPage}</span>
				<button
					on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage >= totalPages || totalPages === 0}
					class="px-3 py-1 rounded-lg bg-[#0b1437] border border-white/10 hover:bg-white/5 disabled:opacity-50 transition"
					>Siguiente</button
				>
			</div>
		</div>
	</section>
</div>

<!-- MODAL DE DETALLES DE PEDIDO -->
{#if showModal && selectedSale}
	<div
		transition:fade
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
	>
		<div
			class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
		>
			<div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1437]/50">
				<div>
					<h3 class="text-xl font-bold text-white">Pedido #{selectedSale.idPedido}</h3>
					<p class="text-xs text-gray-400">{formatDate(selectedSale.fechaPedido)}</p>
				</div>
				<button
					on:click={() => (showModal = false)}
					class="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
					>&times;</button
				>
			</div>

			<div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="p-4 rounded-xl bg-[#0b1437] border border-white/5">
						<h4 class="text-xs font-bold text-blue-400 uppercase mb-2">Datos Cliente</h4>
						<p class="text-sm text-white font-bold">{selectedSale.nombreCliente}</p>
						<p class="text-xs text-gray-400">{selectedSale.correo}</p>
						<p class="text-xs text-gray-400">{selectedSale.telefono || 'Sin teléfono'}</p>
					</div>
					<div class="p-4 rounded-xl bg-[#0b1437] border border-white/5">
						<h4 class="text-xs font-bold text-purple-400 uppercase mb-2">Envío</h4>
						<p class="text-sm text-white">{selectedSale.direccion}</p>
						<p class="text-xs text-gray-500 mt-1">Lima, Perú</p>
					</div>
				</div>

				<div>
					<h4 class="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2">
						Productos Comprados
					</h4>
					{#if parsedProducts.length > 0}
						<div class="space-y-3">
							{#each parsedProducts as item}
								<div class="flex justify-between items-center bg-white/5 p-3 rounded-lg">
									<div class="flex items-center gap-3">
										<div
											class="w-10 h-10 bg-black rounded-lg border border-white/10 flex items-center justify-center text-xs text-gray-500"
										>
											IMG
										</div>
										<div>
											<p class="text-sm font-bold text-white">{item.nombre || 'Producto'}</p>
											<p class="text-xs text-gray-400">Cant: {item.cantidad || 1}</p>
										</div>
									</div>
									<p class="text-sm font-bold text-white">S/.{item.precio || '0.00'}</p>
								</div>
							{/each}
						</div>
					{:else}
						<div class="p-4 bg-white/5 rounded-xl text-sm text-gray-300 whitespace-pre-line">
							Sin detalles de productos.
						</div>
					{/if}
				</div>
			</div>

			<div class="p-6 border-t border-white/10 flex justify-between items-center bg-[#0b1437]/50">
				<span class="text-xs text-gray-400 uppercase font-bold">Total Pagado</span>
				<span class="text-2xl font-bold text-white">S/.{Number(selectedSale.total).toFixed(2)}</span
				>
			</div>
		</div>
	</div>
{/if}
