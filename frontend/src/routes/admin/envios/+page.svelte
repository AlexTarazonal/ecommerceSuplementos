<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Envio {
		idEnvio: number;
		codigoSeguimiento: string;
		fechaDespacho: string;
		fechaEntregaEstimada: string;
		estadoEnvio: 'Preparando' | 'En Camino' | 'Entregado';
		idPedido: number;
		cliente: string;
		metodoEnvio: string;
		direccionCompleta: string;
	}

	let envios: Envio[] = [];
	let loading = true;

	onMount(async () => {
		await fetchEnvios();
	});

	async function fetchEnvios() {
		try {
			const res = await fetch('http://localhost:4000/api/envios');
			if (res.ok) envios = await res.json();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function changeStatus(envio: Envio, nuevoEstado: string) {
		const anterior = envio.estadoEnvio;
		// Actualización optimista UI
		envio.estadoEnvio = nuevoEstado as any;
		envios = [...envios];

		try {
			const res = await fetch(`http://localhost:4000/api/envios/${envio.idEnvio}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nuevoEstado })
			});

			if (!res.ok) throw new Error();

			// Notificación simple (puedes mejorarla)
			console.log(`Estado actualizado a ${nuevoEstado}`);
		} catch (e) {
			alert('Error al actualizar estado');
			envio.estadoEnvio = anterior; // Revertir
			envios = [...envios];
		}
	}

	function formatDate(date: string) {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('es-PE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'Preparando':
				return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
			case 'En Camino':
				return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
			case 'Entregado':
				return 'bg-green-500/20 text-green-400 border-green-500/20';
			default:
				return 'bg-gray-500/20 text-gray-400';
		}
	}
</script>

<div class="flex flex-col gap-8 pb-10 w-full text-white">
	<!-- Header -->
	<div
		class="bg-[#0f172a]/70 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-[0_20px_50px_rgba(8,112,184,0.15)] flex justify-between items-center"
	>
		<div>
			<h2 class="text-2xl font-bold text-white">Gestión de Envíos</h2>
			<p class="text-sm text-gray-400">Control logístico de pedidos</p>
		</div>
		<div class="flex items-center gap-4">
			<div class="px-4 py-2 bg-[#0b1437] rounded-xl border border-white/10 flex items-center gap-2">
				<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
				<span class="text-xs font-bold text-gray-300">Sistema Activo</span>
			</div>
		</div>
	</div>

	<!-- Tabla Envíos -->
	<section
		class="bg-[#0f172a]/70 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-lg overflow-hidden"
	>
		<div class="overflow-x-auto min-h-[400px]">
			<table class="w-full text-left border-collapse">
				<thead
					class="bg-[#0b1437]/50 text-xs uppercase text-gray-400 font-bold border-b border-white/10"
				>
					<tr>
						<th class="p-4">Tracking</th>
						<th class="p-4">Pedido / Cliente</th>
						<th class="p-4">Método / Destino</th>
						<th class="p-4 text-center">Fechas</th>
						<th class="p-4 text-center">Estado Actual</th>
						<th class="p-4 text-right">Acciones</th>
					</tr>
				</thead>
				<tbody class="text-sm divide-y divide-white/5">
					{#if loading}
						<tr><td colspan="6" class="p-8 text-center text-gray-400">Cargando envíos...</td></tr>
					{:else if envios.length === 0}
						<tr
							><td colspan="6" class="p-8 text-center text-gray-400">No hay envíos registrados.</td
							></tr
						>
					{:else}
						{#each envios as envio}
							<tr class="hover:bg-white/5 transition-colors group">
								<!-- Tracking -->
								<td class="p-4">
									<div class="flex items-center gap-2">
										<div class="p-2 rounded-lg bg-blue-600/20 text-blue-400">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
												></path><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0m2 0a2 2 0 012 2v0m2 0a2 2 0 012 2v0"
												></path></svg
											>
										</div>
										<span class="font-mono font-bold text-white tracking-wide"
											>{envio.codigoSeguimiento}</span
										>
									</div>
								</td>

								<!-- Pedido / Cliente -->
								<td class="p-4">
									<p class="text-blue-400 font-bold">Orden #{envio.idPedido}</p>
									<p class="text-gray-400 text-xs">{envio.cliente}</p>
								</td>

								<!-- Método -->
								<td class="p-4">
									<p class="text-white font-bold">{envio.metodoEnvio}</p>
									<p
										class="text-gray-500 text-xs truncate max-w-[150px]"
										title={envio.direccionCompleta}
									>
										{envio.direccionCompleta}
									</p>
								</td>

								<!-- Fechas -->
								<td class="p-4 text-center">
									<div class="flex flex-col items-center gap-1">
										<span class="text-[10px] text-gray-500 uppercase">Estimada</span>
										<span class="font-bold text-white"
											>{formatDate(envio.fechaEntregaEstimada)}</span
										>
									</div>
								</td>

								<!-- Estado (Selector) -->
								<td class="p-4 text-center">
									<div class="relative inline-block">
										<select
											value={envio.estadoEnvio}
											on:change={(e) => changeStatus(envio, e.currentTarget.value)}
											class="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer outline-none border bg-[#0b1437] {getStatusColor(
												envio.estadoEnvio
											)}"
										>
											<option value="Preparando">Preparando</option>
											<option value="En Camino">En Camino</option>
											<option value="Entregado">Entregado</option>
										</select>
										<!-- Flechita custom -->
										<div
											class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"
										>
											<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 9l-7 7-7-7"
												></path></svg
											>
										</div>
									</div>
								</td>

								<!-- Acciones (Simuladas) -->
								<td class="p-4 text-right">
									<button
										class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
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
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</section>
</div>
