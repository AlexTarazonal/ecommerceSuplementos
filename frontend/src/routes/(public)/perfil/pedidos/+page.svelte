<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	// Interfaces
	interface OrderItem {
		nombre: string;
		cantidad: number;
		precio: number;
	}

	interface Order {
		idPedido: number;
		fechaPedido: string;
		total: number;
		idEstadoPedido: number;
		estadoEnvio: string;
		codigoSeguimiento: string;
		fechaEntregaEstimada: string;
		nombreContacto: string;
		telefonoContacto: string;
		correoContacto: string;
		direccionCompleta: string;
		// Datos crudos para edición
		idDireccion: number;
		linea1: string;
		ciudad: string;
		codigoPostal: string;
		referencia: string;
		items: any;
	}

	let user: any = null;
	let orders: Order[] = [];
	let loading = true;

	// Modal Edición
	let showModal = false;
	let selectedOrder: Order | null = null;
	let isEditable = false;
	let saving = false;

	// Formulario Edición
	let formEdit = {
		nombre: '',
		telefono: '',
		correo: '',
		direccion: {
			linea1: '',
			ciudad: '',
			codigoPostal: '',
			referencia: ''
		}
	};

	// ERRORES DE VALIDACIÓN
	let errors = {
		nombre: '',
		telefono: '',
		correo: '',
		direccion: '',
		ciudad: '',
		postal: '',
		referencia: ''
	};

	onMount(async () => {
		const userStored = localStorage.getItem('usuario');
		const token = localStorage.getItem('token');

		if (!token || !userStored) {
			goto('/login');
			return;
		}
		user = JSON.parse(userStored);
		await fetchOrders();
	});

	async function fetchOrders() {
		try {
			const res = await fetch(`http://localhost:4000/api/cliente/orders/${user.id}`);
			if (res.ok) orders = await res.json();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	// --- VALIDACIONES (Reglas Estrictas) ---

	function validateName() {
		const val = formEdit.nombre.trim();
		if (!val) return (errors.nombre = 'El nombre es obligatorio.');
		if (val.length < 3) return (errors.nombre = 'Mínimo 3 caracteres.');
		if (val.length > 16) return (errors.nombre = 'Máximo 16 caracteres.');
		// Solo letras y espacios
		if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(val)) return (errors.nombre = 'Solo letras y espacios.');
		errors.nombre = '';
	}

	function handlePhoneInput(e: Event) {
		const target = e.target as HTMLInputElement;
		target.value = target.value.replace(/\D/g, '').slice(0, 9);
		formEdit.telefono = target.value;
		validatePhone();
	}

	function validatePhone() {
		const val = formEdit.telefono;
		if (!val) return (errors.telefono = 'Obligatorio.');
		if (val.length !== 9) return (errors.telefono = 'Debe tener 9 dígitos.');
		errors.telefono = '';
	}

	function validateEmail() {
		formEdit.correo = formEdit.correo.trim().replace(/\s/g, '');
		const val = formEdit.correo;

		if (!val) return (errors.correo = 'Obligatorio.');
		if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val))
			return (errors.correo = 'Formato inválido.');

		const localPart = val.split('@')[0];
		if (localPart.length < 3) return (errors.correo = 'Min 3 chars antes del @.');
		if (!/[a-zA-Z]/.test(localPart)) return (errors.correo = 'Debe tener letra antes del @.');

		errors.correo = '';
	}

	function validateAddressLine() {
		const val = formEdit.direccion.linea1.trim();
		if (!val) return (errors.direccion = 'Obligatorio.');
		if (val.length < 3) return (errors.direccion = 'Min 3 chars.');
		if (val.length > 32) return (errors.direccion = 'Max 32 chars.');

		if (!/^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s.,]+$/.test(val))
			return (errors.direccion = 'Caracteres inválidos.');
		if (/^[0-9\s.,]+$/.test(val)) return (errors.direccion = 'No solo números.');
		if (/^[.,\s]+$/.test(val)) return (errors.direccion = 'No solo signos.');

		errors.direccion = '';
	}

	function validateCity() {
		const val = formEdit.direccion.ciudad.trim();
		if (!val) return (errors.ciudad = 'Obligatorio.');
		if (val.length < 3) return (errors.ciudad = 'Min 3 chars.');
		if (val.length > 16) return (errors.ciudad = 'Max 16 chars.');
		if (/[0-9]/.test(val)) return (errors.ciudad = 'No números.');
		if (/\s/.test(val)) return (errors.ciudad = 'No espacios.'); // Regla estricta solicitada
		if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/.test(val)) return (errors.ciudad = 'Solo letras.');

		errors.ciudad = '';
	}

	function handlePostalInput(e: Event) {
		const target = e.target as HTMLInputElement;
		target.value = target.value.replace(/\D/g, '').slice(0, 7);
		formEdit.direccion.codigoPostal = target.value;
		validatePostal();
	}

	function validatePostal() {
		const val = formEdit.direccion.codigoPostal;
		if (val.length < 3) return (errors.postal = 'Min 3 dígitos.');
		errors.postal = '';
	}

	function validateReference() {
		const val = formEdit.direccion.referencia.trim();
		if (!val) return (errors.referencia = 'Obligatorio.');
		if (val.length < 5) return (errors.referencia = 'Min 5 chars.');
		if (val.length > 32) return (errors.referencia = 'Max 32 chars.');
		if (/[0-9]/.test(val)) return (errors.referencia = 'No números.');
		if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(val))
			return (errors.referencia = 'Solo letras y espacios.');

		errors.referencia = '';
	}

	// Helper para deshabilitar botón
	$: isFormValid =
		!errors.nombre &&
		formEdit.nombre &&
		!errors.telefono &&
		formEdit.telefono &&
		!errors.correo &&
		formEdit.correo &&
		!errors.direccion &&
		formEdit.direccion.linea1 &&
		!errors.ciudad &&
		formEdit.direccion.ciudad &&
		!errors.postal &&
		formEdit.direccion.codigoPostal &&
		!errors.referencia &&
		formEdit.direccion.referencia;

	// ----------------------------------

	function openEdit(order: Order) {
		if (order.estadoEnvio && order.estadoEnvio !== 'Preparando') {
			return alert('Este pedido ya no se puede editar porque ha salido de almacén.');
		}

		selectedOrder = order;
		isEditable = true;

		// Cargar datos
		formEdit = {
			nombre: order.nombreContacto || '',
			telefono: order.telefonoContacto || '',
			correo: order.correoContacto || '',
			direccion: {
				linea1: order.linea1 || '',
				ciudad: order.ciudad || '',
				codigoPostal: order.codigoPostal || '',
				referencia: order.referencia || ''
			}
		};

		// Resetear errores al abrir
		errors = {
			nombre: '',
			telefono: '',
			correo: '',
			direccion: '',
			ciudad: '',
			postal: '',
			referencia: ''
		};

		// Validar datos iniciales para ver si ya cumplen (probablemente sí porque vienen de la BD, pero validamos igual)
		validateName();
		validatePhone();
		validateEmail();
		validateAddressLine();
		validateCity();
		validatePostal();
		validateReference();

		showModal = true;
	}

	async function saveChanges() {
		// Limpieza final (Trim)
		formEdit.nombre = formEdit.nombre.trim();
		formEdit.direccion.linea1 = formEdit.direccion.linea1.trim();
		formEdit.direccion.ciudad = formEdit.direccion.ciudad.trim();
		formEdit.direccion.referencia = formEdit.direccion.referencia.trim();

		if (!isFormValid || !selectedOrder) return;
		saving = true;

		try {
			const res = await fetch(`http://localhost:4000/api/cliente/order/${selectedOrder.idPedido}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: formEdit.nombre,
					telefono: formEdit.telefono,
					correo: formEdit.correo,
					idDireccion: selectedOrder.idDireccion,
					direccionData: formEdit.direccion
				})
			});

			const data = await res.json();

			if (res.ok) {
				alert('Datos de entrega actualizados correctamente.');
				showModal = false;
				await fetchOrders();
			} else {
				alert('Error: ' + data.message);
			}
		} catch (e) {
			alert('Error de conexión');
		} finally {
			saving = false;
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
		if (!status) return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
		switch (status) {
			case 'Preparando':
				return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
			case 'En Camino':
				return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
			case 'Entregado':
				return 'text-green-400 bg-green-500/10 border-green-500/20';
			default:
				return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
		}
	}

	function parseItems(items: any): OrderItem[] {
		if (Array.isArray(items)) return items;
		if (typeof items === 'string') {
			try {
				return JSON.parse(items);
			} catch {
				return [];
			}
		}
		return [];
	}
</script>

<div class="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
	<div class="fixed inset-0 bg-[#0f172a] -z-20"></div>
	<div
		class="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[150px] pointer-events-none -z-10"
	></div>
	<div
		class="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none -z-10"
	></div>

	<div class="max-w-5xl mx-auto">
		<h2 class="text-3xl font-bold text-white mb-2">Mis Pedidos</h2>
		<p class="text-gray-400 mb-8">Historial de compras y seguimiento.</p>

		{#if loading}
			<div class="text-center text-white py-20 animate-pulse">Cargando tus pedidos...</div>
		{:else if orders.length === 0}
			<div
				class="p-16 text-center bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center"
			>
				<div
					class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-500"
				>
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						></path></svg
					>
				</div>
				<h3 class="text-xl font-bold text-white mb-2">Aún no tienes pedidos</h3>
				<a
					href="/tienda"
					class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
					>Ir a la Tienda</a
				>
			</div>
		{:else}
			<div class="space-y-6">
				{#each orders as order}
					<!-- ALERTA DE PAGO PENDIENTE -->
					{#if order.idEstadoPedido === 1}
						<div
							class="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-[-1rem] flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 mx-4 shadow-lg animate-pulse"
						>
							<div class="flex items-center gap-3">
								<div class="p-2 bg-red-500 rounded-full text-white">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path></svg
									>
								</div>
								<div>
									<p class="text-white font-bold text-sm">Pago Pendiente</p>
									<p class="text-red-300 text-xs">
										Este pedido aún no ha sido pagado y no se enviará.
									</p>
								</div>
							</div>
							<a
								href="/checkout/pago/{order.idPedido}"
								class="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-red-600/30"
								>Pagar Ahora</a
							>
						</div>
					{/if}

					<div
						class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-blue-500/30 transition-all duration-300 group"
					>
						<div
							class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 mb-4"
						>
							<div class="flex items-center gap-4">
								<div
									class="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30 flex-shrink-0"
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
								<div>
									<h4 class="text-lg font-bold text-white flex items-center gap-3">
										Pedido #{order.idPedido}
										{#if order.estadoEnvio}
											<span
												class="text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide {getStatusColor(
													order.estadoEnvio
												)}">{order.estadoEnvio}</span
											>
										{:else}
											<span
												class="text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide text-gray-400 border-gray-500/20"
												>Procesando</span
											>
										{/if}
									</h4>
									<p class="text-gray-400 text-xs mt-1">
										Realizado el {formatDate(order.fechaPedido)}
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-xl font-bold text-white">S/.{Number(order.total).toFixed(2)}</p>
								{#if order.codigoSeguimiento}
									<p class="text-xs text-blue-400 font-mono mt-1 tracking-wider">
										TRK: {order.codigoSeguimiento}
									</p>
								{/if}
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-2 text-sm">
								<p class="text-gray-400 uppercase text-[10px] font-bold">Datos de Entrega</p>
								<div class="text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
									<p class="mb-1">
										<span class="text-white font-bold">Recibe:</span>
										{order.nombreContacto || 'Usuario'}
									</p>
									<p class="mb-1">
										<span class="text-white font-bold">Teléfono:</span>
										{order.telefonoContacto}
									</p>
									<p class="mb-1">
										<span class="text-white font-bold">Correo:</span>
										{order.correoContacto}
									</p>
									<p class="mt-2 pt-2 border-t border-white/10 text-xs">
										<span class="text-white font-bold">Dirección:</span>
										{order.direccionCompleta}
									</p>
									{#if order.fechaEntregaEstimada}
										<p class="mt-2 text-green-400 text-xs font-bold flex items-center gap-1">
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
												></path></svg
											>Llegada estimada: {formatDate(order.fechaEntregaEstimada)}
										</p>
									{/if}
								</div>
								{#if (!order.estadoEnvio || order.estadoEnvio === 'Preparando') && order.idEstadoPedido !== 1}
									<button
										on:click={() => openEdit(order)}
										class="mt-2 text-xs font-bold text-blue-400 hover:text-white hover:underline flex items-center gap-1 transition-colors"
										><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
											></path></svg
										>Editar datos de entrega</button
									>
								{/if}
							</div>
							<div>
								<p class="text-gray-400 uppercase text-[10px] font-bold mb-2">Productos</p>
								<div class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
									{#each parseItems(order.items) as item}
										<div
											class="flex justify-between text-xs text-gray-300 border-b border-white/5 pb-1 last:border-0"
										>
											<span
												><span class="text-white font-bold">{item.cantidad}x</span>
												{item.nombre}</span
											>
											<span>S/.{item.precio}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- MODAL EDICIÓN CON VALIDACIONES -->
{#if showModal && selectedOrder}
	<div
		transition:fade
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
	>
		<div
			class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
		>
			<div class="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
				<h3 class="text-xl font-bold text-white">Editar Entrega</h3>
				<button on:click={() => (showModal = false)} class="text-gray-400 hover:text-white text-2xl"
					>&times;</button
				>
			</div>

			<p
				class="text-xs text-green-400 mb-6 bg-green-500/10 p-3 rounded-lg border border-green-500/20"
			>
				Tu pedido aún está en preparación, puedes actualizar tus datos.
			</p>

			<div class="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
				<!-- Contacto -->
				<h4 class="text-xs font-bold text-blue-400 uppercase">Contacto</h4>
				<div>
					<label class="block text-[10px] font-bold text-gray-500 mb-1"
						>Nombre de quien recibe</label
					>
					<input
						type="text"
						bind:value={formEdit.nombre}
						on:input={validateName}
						class="w-full bg-[#0b1437] text-white rounded-lg border {errors.nombre
							? 'border-red-500'
							: 'border-white/10'} px-3 py-2 outline-none focus:border-blue-500 text-sm"
					/>
					{#if errors.nombre}<p class="text-red-400 text-[10px] mt-1">{errors.nombre}</p>{/if}
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-[10px] font-bold text-gray-500 mb-1">Teléfono</label>
						<input
							type="tel"
							value={formEdit.telefono}
							on:input={handlePhoneInput}
							maxlength="9"
							class="w-full bg-[#0b1437] text-white rounded-lg border {errors.telefono
								? 'border-red-500'
								: 'border-white/10'} px-3 py-2 outline-none focus:border-blue-500 text-sm"
						/>
						{#if errors.telefono}<p class="text-red-400 text-[10px] mt-1">{errors.telefono}</p>{/if}
					</div>
					<div>
						<label class="block text-[10px] font-bold text-gray-500 mb-1">Correo</label>
						<input
							type="email"
							bind:value={formEdit.correo}
							on:input={validateEmail}
							class="w-full bg-[#0b1437] text-white rounded-lg border {errors.correo
								? 'border-red-500'
								: 'border-white/10'} px-3 py-2 outline-none focus:border-blue-500 text-sm"
						/>
						{#if errors.correo}<p class="text-red-400 text-[10px] mt-1">{errors.correo}</p>{/if}
					</div>
				</div>

				<!-- Dirección -->
				<h4 class="text-xs font-bold text-purple-400 uppercase pt-2 border-t border-white/5">
					Dirección
				</h4>
				<div>
					<label class="block text-[10px] font-bold text-gray-500 mb-1">Dirección Exacta</label>
					<input
						type="text"
						bind:value={formEdit.direccion.linea1}
						on:input={validateAddressLine}
						class="w-full bg-[#0b1437] text-white rounded-lg border {errors.direccion
							? 'border-red-500'
							: 'border-white/10'} px-3 py-2 outline-none focus:border-blue-500 text-sm"
					/>
					{#if errors.direccion}<p class="text-red-400 text-[10px] mt-1">{errors.direccion}</p>{/if}
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-[10px] font-bold text-gray-500 mb-1">Ciudad</label>
						<input
							type="text"
							bind:value={formEdit.direccion.ciudad}
							on:input={validateCity}
							class="w-full bg-[#0b1437] text-white rounded-lg border {errors.ciudad
								? 'border-red-500'
								: 'border-white/10'} px-3 py-2 outline-none focus:border-blue-500 text-sm"
						/>
						{#if errors.ciudad}<p class="text-red-400 text-[10px] mt-1">{errors.ciudad}</p>{/if}
					</div>
					<div>
						<label class="block text-[10px] font-bold text-gray-500 mb-1">Código Postal</label>
						<input
							type="text"
							value={formEdit.direccion.codigoPostal}
							on:input={handlePostalInput}
							maxlength="7"
							class="w-full bg-[#0b1437] text-white rounded-lg border {errors.postal
								? 'border-red-500'
								: 'border-white/10'} px-3 py-2 outline-none focus:border-blue-500 text-sm"
						/>
						{#if errors.postal}<p class="text-red-400 text-[10px] mt-1">{errors.postal}</p>{/if}
					</div>
				</div>
				<div>
					<label class="block text-[10px] font-bold text-gray-500 mb-1">Referencia</label>
					<input
						type="text"
						bind:value={formEdit.direccion.referencia}
						on:input={validateReference}
						class="w-full bg-[#0b1437] text-white rounded-lg border {errors.referencia
							? 'border-red-500'
							: 'border-white/10'} px-3 py-2 outline-none focus:border-blue-500 text-sm"
					/>
					{#if errors.referencia}<p class="text-red-400 text-[10px] mt-1">
							{errors.referencia}
						</p>{/if}
				</div>
			</div>

			<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
				<button
					on:click={() => (showModal = false)}
					class="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition"
					>Cancelar</button
				>
				<button
					on:click={saveChanges}
					disabled={saving || !isFormValid}
					class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
				>
					{saving ? 'Guardando...' : 'Guardar Cambios'}
				</button>
			</div>
		</div>
	</div>
{/if}
