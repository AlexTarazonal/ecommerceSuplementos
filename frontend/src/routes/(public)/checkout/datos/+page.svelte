<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/cart';
	import { fade } from 'svelte/transition';

	// --- INTERFACES ---
	interface Address {
		idDireccion: number;
		alias: string;
		linea1: string;
		ciudad: string;
		codigoPostal: string;
		referencia: string;
		esPrincipal: boolean;
	}

	interface ShippingMethod {
		idMetodoEnvio: number;
		nombre: string;
		costo: string;
		tiempoEstimado: string;
	}

	// --- ESTADO ---
	let user: any = null;
	let addresses: Address[] = [];
	let shippingMethods: ShippingMethod[] = [];
	let loading = true;
	let processing = false;

	// Datos del Formulario de Contacto
	let contactName = ''; // NUEVO
	let contactPhone = '';
	let contactEmail = '';

	// Selecciones
	let selectedAddressId: number | null = null;
	let selectedShippingId: number | null = null;

	// Variables de error para validación de contacto
	let nameError = ''; // NUEVO
	let emailError = '';
	let phoneError = '';

	// Modal Nueva Dirección
	let showAddressModal = false;
	let newAddress = { alias: '', linea1: '', ciudad: '', codigoPostal: '', referencia: '' };

	// Variables de error para el modal (dirección)
	let aliasError = '';
	let addressError = '';
	let cityError = '';
	let postalError = '';
	let referenceError = '';

	// --- CÁLCULOS ---
	$: cartTotal = $cart.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
	$: shippingCost = selectedShippingId
		? Number(shippingMethods.find((m) => m.idMetodoEnvio === selectedShippingId)?.costo || 0)
		: 0;
	$: finalTotal = cartTotal + shippingCost;

	// --- INICIALIZACIÓN ---
	onMount(async () => {
		const userStored = localStorage.getItem('usuario');
		const token = localStorage.getItem('token');

		if (!token || !userStored) {
			alert('Debes iniciar sesión para continuar.');
			goto('/login');
			return;
		}

		user = JSON.parse(userStored);

		// Pre-llenar datos (Editables)
		contactName = user.nombre + ' ' + (user.apellido || ''); // Pre-llenar nombre completo
		contactPhone = user.telefono || '';
		contactEmail = user.email || '';

		// Validar inicialmente para activar botón si todo está correcto
		if (contactName) validateName();
		if (contactPhone) validatePhone();
		if (contactEmail) validateEmail();

		await Promise.all([fetchAddresses(), fetchShippingMethods()]);
		loading = false;
	});

	// --- API FETCH ---
	async function fetchAddresses() {
		try {
			const res = await fetch(`http://localhost:4000/api/direcciones/${user.id}`);
			if (res.ok) {
				addresses = await res.json();
				const principal = addresses.find((a) => a.esPrincipal);
				if (principal) selectedAddressId = principal.idDireccion;
				else if (addresses.length > 0) selectedAddressId = addresses[0].idDireccion;
			}
		} catch (e) {
			console.error(e);
		}
	}

	async function fetchShippingMethods() {
		try {
			const res = await fetch('http://localhost:4000/api/shop/shipping-methods');
			if (res.ok) shippingMethods = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	// --- VALIDACIONES CONTACTO ---

	// 1. Nombre
	function validateName() {
		const val = contactName.trim();
		if (!val) {
			nameError = 'El nombre es obligatorio.';
			return false;
		}
		if (val.length < 3) {
			nameError = 'Mínimo 3 caracteres.';
			return false;
		}
		// Solo letras y espacios
		if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(val)) {
			nameError = 'Solo letras y espacios.';
			return false;
		}
		nameError = '';
		return true;
	}

	// 2. Email
	function validateEmail() {
		contactEmail = contactEmail.trim().replace(/\s/g, '');
		if (!contactEmail) {
			emailError = 'El correo es obligatorio.';
			return false;
		}
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(contactEmail)) {
			emailError = 'Formato inválido.';
			return false;
		}
		const atIndex = contactEmail.indexOf('@');
		const localPart = contactEmail.substring(0, atIndex);
		if (localPart.length < 3) {
			emailError = 'Mínimo 3 caracteres antes del @.';
			return false;
		}
		if (!/[a-zA-Z]/.test(localPart)) {
			emailError = 'Debe contener al menos una letra antes del @.';
			return false;
		}
		emailError = '';
		return true;
	}

	// 3. Teléfono
	function handlePhoneInput(e: Event) {
		const target = e.target as HTMLInputElement;
		target.value = target.value.replace(/\D/g, '').slice(0, 9);
		contactPhone = target.value;
		validatePhone();
	}

	function validatePhone() {
		const val = contactPhone.trim();
		if (!val) {
			phoneError = 'Obligatorio.';
			return false;
		}
		if (val.length !== 9) {
			phoneError = 'Debe tener 9 dígitos.';
			return false;
		}
		phoneError = '';
		return true;
	}

	// Validación General del Formulario de Pedido
	function validateOrderForm(): boolean {
		const v1 = validateName();
		const v2 = validateEmail();
		const v3 = validatePhone();

		if ($cart.length === 0) {
			alert('Tu carrito está vacío.');
			return false;
		}
		if (!selectedAddressId) {
			alert('Selecciona una dirección.');
			return false;
		}
		if (!selectedShippingId) {
			alert('Selecciona un método de envío.');
			return false;
		}

		if (!v1 || !v2 || !v3) return false;

		return true;
	}

	// --- VALIDACIONES MODAL DIRECCIÓN (IGUAL QUE ANTES) ---
	function validateAlias() {
		const val = newAddress.alias.trim();
		if (!val) {
			aliasError = 'Obligatorio.';
			return false;
		}
		if (val.length < 3) {
			aliasError = 'Min 3 chars.';
			return false;
		}
		if (val.length > 16) {
			aliasError = 'Max 16 chars.';
			return false;
		}
		if (/[0-9]/.test(val)) {
			aliasError = 'Sin números.';
			return false;
		}
		if (/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/.test(val)) {
			aliasError = 'Sin símbolos.';
			return false;
		}
		aliasError = '';
		return true;
	}
	function validateAddressLine() {
		const val = newAddress.linea1.trim();
		if (!val) {
			addressError = 'Obligatorio.';
			return false;
		}
		if (val.length < 3) {
			addressError = 'Min 3 chars.';
			return false;
		}
		if (val.length > 32) {
			addressError = 'Max 32 chars.';
			return false;
		}
		if (/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s.,]/.test(val)) {
			addressError = 'Caracteres inválidos.';
			return false;
		}
		if (/^[0-9\s.,]+$/.test(val)) {
			addressError = 'No solo números.';
			return false;
		}
		addressError = '';
		return true;
	}
	function validateCity() {
		const val = newAddress.ciudad.trim();
		if (!val) {
			cityError = 'Obligatorio.';
			return false;
		}
		if (val.length < 3) {
			cityError = 'Min 3 chars.';
			return false;
		}
		if (/[0-9]/.test(val)) {
			cityError = 'Sin números.';
			return false;
		}
		if (/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/.test(val)) {
			cityError = 'Solo letras.';
			return false;
		}
		cityError = '';
		return true;
	}
	function handlePostalInput(e: Event) {
		const t = e.target as HTMLInputElement;
		t.value = t.value.replace(/\D/g, '').slice(0, 7);
		newAddress.codigoPostal = t.value;
		validatePostal();
	}
	function validatePostal() {
		if (newAddress.codigoPostal.length < 3) {
			postalError = 'Min 3 dígitos.';
			return false;
		}
		postalError = '';
		return true;
	}
	function validateReference() {
		const val = newAddress.referencia.trim();
		if (!val) {
			referenceError = 'Obligatorio.';
			return false;
		}
		if (val.length < 5) {
			referenceError = 'Min 5 chars.';
			return false;
		}
		if (val.length > 32) {
			referenceError = 'Max 32 chars.';
			return false;
		}
		if (/[0-9]/.test(val)) {
			referenceError = 'Sin números.';
			return false;
		}
		referenceError = '';
		return true;
	}

	$: isAddressFormValid =
		!aliasError &&
		newAddress.alias &&
		!addressError &&
		newAddress.linea1 &&
		!cityError &&
		newAddress.ciudad &&
		!postalError &&
		newAddress.codigoPostal &&
		!referenceError &&
		newAddress.referencia;

	// --- ACCIONES ---
	async function saveNewAddress() {
		if (
			!validateAlias() ||
			!validateAddressLine() ||
			!validateCity() ||
			!validatePostal() ||
			!validateReference()
		)
			return;
		try {
			const res = await fetch('http://localhost:4000/api/direcciones', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idUsuario: user.id, ...newAddress })
			});
			if (res.ok) {
				await fetchAddresses();
				showAddressModal = false;
				newAddress = { alias: '', linea1: '', ciudad: '', codigoPostal: '', referencia: '' };
				aliasError = '';
				addressError = '';
				cityError = '';
				postalError = '';
				referenceError = '';
			} else {
				const err = await res.json();
				alert('Error: ' + err.message);
			}
		} catch (e) {
			alert('Error de conexión');
		}
	}

	async function createOrder() {
		if (!validateOrderForm()) return;
		processing = true;
		try {
			const res = await fetch('http://localhost:4000/api/shop/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					idUsuario: user.id,
					idDireccion: selectedAddressId,
					idMetodoEnvio: selectedShippingId,
					// --- DATOS DE CONTACTO ACTUALIZADOS ---
					nombreContacto: contactName, // NUEVO
					correoContacto: contactEmail, // NUEVO
					telefonoContacto: contactPhone,
					carrito: $cart
				})
			});
			const data = await res.json();
			if (res.ok) {
				goto(`/checkout/pago/${data.idPedido}`);
			} else {
				alert(`Error: ${data.message}`);
			}
		} catch (e) {
			console.error(e);
			alert('Error al procesar la orden.');
		} finally {
			processing = false;
		}
	}
</script>

<div class="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
	<!-- Fondo Vision UI -->
	<div class="fixed inset-0 bg-[#0f172a] -z-20"></div>
	<div
		class="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-900/20 rounded-full blur-[180px] pointer-events-none -z-10"
	></div>
	<div
		class="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none -z-10"
	></div>

	<div class="max-w-6xl mx-auto">
		<!-- Breadcrumb -->
		<div class="flex justify-center mb-12">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2 text-blue-400">
					<div
						class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/50"
					>
						1
					</div>
					<span class="font-bold text-sm uppercase tracking-wider">Datos</span>
				</div>
				<div class="w-16 h-0.5 bg-gray-700"></div>
				<div class="flex items-center gap-2 text-gray-500 opacity-50">
					<div
						class="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400 font-bold"
					>
						2
					</div>
					<span class="font-bold text-sm uppercase tracking-wider">Pago</span>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="text-center text-white py-20 animate-pulse">Cargando información de envío...</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- COLUMNA IZQUIERDA -->
				<div class="lg:col-span-2 space-y-8">
					<!-- 1. CONTACTO -->
					<section
						class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(8,112,184,0.1)]"
					>
						<h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
							<span class="p-2 rounded-lg bg-blue-500/20 text-blue-400"
								><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
									></path></svg
								></span
							>
							Información de Contacto
						</h3>

						<!-- NUEVO CAMPO: NOMBRE DE CONTACTO -->
						<div class="mb-4">
							<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
								>Nombre de Contacto</label
							>
							<input
								type="text"
								bind:value={contactName}
								on:input={validateName}
								on:blur={validateName}
								placeholder="Juan Perez"
								class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {nameError
									? 'border-red-500 focus:border-red-500'
									: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
							/>
							{#if nameError}<p class="text-red-400 text-xs mt-1 ml-1">{nameError}</p>{/if}
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
									>Correo Electrónico</label
								>
								<input
									type="email"
									bind:value={contactEmail}
									on:input={validateEmail}
									on:blur={validateEmail}
									placeholder="usuario@dominio.com"
									class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {emailError
										? 'border-red-500 focus:border-red-500'
										: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
								/>
								{#if emailError}<p class="text-red-400 text-xs mt-1 ml-1">{emailError}</p>{/if}
							</div>
							<div>
								<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
									>Teléfono Celular</label
								>
								<input
									type="tel"
									value={contactPhone}
									on:input={handlePhoneInput}
									on:blur={validatePhone}
									placeholder="Ej: 999888777"
									maxlength="9"
									class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {phoneError
										? 'border-red-500 focus:border-red-500'
										: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
								/>
								{#if phoneError}<p class="text-red-400 text-xs mt-1 ml-1">{phoneError}</p>{/if}
							</div>
						</div>
					</section>

					<!-- 2. DIRECCIÓN DE ENVÍO -->
					<section
						class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(8,112,184,0.1)]"
					>
						<!-- ... Igual que antes ... -->
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-xl font-bold text-white flex items-center gap-3">
								<span class="p-2 rounded-lg bg-purple-500/20 text-purple-400"
									><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										></path><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										></path></svg
									></span
								> Dirección de Envío
							</h3>
							<button
								on:click={() => (showAddressModal = true)}
								class="text-xs font-bold text-blue-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
								>+ Nueva Dirección</button
							>
						</div>
						{#if addresses.length === 0}
							<div class="text-center py-8 border-2 border-dashed border-white/10 rounded-2xl">
								<p class="text-gray-500 text-sm mb-4">No tienes direcciones guardadas.</p>
								<button
									on:click={() => (showAddressModal = true)}
									class="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors"
									>Agregar Dirección</button
								>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each addresses as addr}
									<div
										class="relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-start gap-4 hover:shadow-lg {selectedAddressId ===
										addr.idDireccion
											? 'bg-blue-600/10 border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]'
											: 'bg-[#0b1437] border-white/5 hover:border-white/20'}"
										on:click={() => (selectedAddressId = addr.idDireccion)}
									>
										<div
											class="mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 {selectedAddressId ===
											addr.idDireccion
												? 'border-blue-500'
												: 'border-gray-600'}"
										>
											{#if selectedAddressId === addr.idDireccion}<div
													class="w-2.5 h-2.5 bg-blue-500 rounded-full"
												></div>{/if}
										</div>
										<div>
											<div class="flex items-center gap-2">
												<h4 class="text-white font-bold text-sm mb-1">{addr.alias || 'Casa'}</h4>
												{#if addr.esPrincipal}<span
														class="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 rounded uppercase font-bold"
														>Principal</span
													>{/if}
											</div>
											<p class="text-gray-400 text-xs leading-relaxed">
												{addr.linea1}<br />{addr.ciudad}, {addr.codigoPostal}
											</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</section>

					<!-- 3. MÉTODO DE ENVÍO -->
					<section
						class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(8,112,184,0.1)]"
					>
						<!-- ... Igual que antes ... -->
						<h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
							<span class="p-2 rounded-lg bg-green-500/20 text-green-400"
								><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
									></path><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0m2 0a2 2 0 012 2v0m2 0a2 2 0 012 2v0"
									></path></svg
								></span
							>Método de Envío
						</h3>
						<div class="space-y-3">
							{#each shippingMethods as method}
								<div
									class="flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer {selectedShippingId ===
									method.idMetodoEnvio
										? 'bg-blue-600/10 border-blue-500 shadow-lg'
										: 'bg-[#0b1437] border-white/5 hover:border-white/20'}"
									on:click={() => (selectedShippingId = method.idMetodoEnvio)}
								>
									<div class="flex items-center gap-4">
										<div
											class="w-5 h-5 rounded-full border-2 flex items-center justify-center {selectedShippingId ===
											method.idMetodoEnvio
												? 'border-blue-500'
												: 'border-gray-600'}"
										>
											{#if selectedShippingId === method.idMetodoEnvio}<div
													class="w-2.5 h-2.5 bg-blue-500 rounded-full"
												></div>{/if}
										</div>
										<div>
											<p class="text-white font-bold text-sm">{method.nombre}</p>
											<p class="text-gray-500 text-xs">Llega en: {method.tiempoEstimado}</p>
										</div>
									</div>
									<span class="text-white font-bold text-sm"
										>S/.{Number(method.costo).toFixed(2)}</span
									>
								</div>
							{/each}
						</div>
					</section>
				</div>

				<!-- RESUMEN -->
				<div class="lg:col-span-1">
					<div
						class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-32"
					>
						<!-- ... Igual que antes ... -->
						<h4 class="text-lg font-bold text-white mb-4">Resumen del Pedido</h4>
						<div class="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
							{#each $cart as item}
								<div class="flex justify-between items-start text-sm">
									<div class="text-gray-400 w-2/3">
										<span class="text-white font-bold">{item.cantidad}x</span>
										{item.nombre}
									</div>
									<span class="text-white font-bold"
										>S/.{(Number(item.precio) * item.cantidad).toFixed(2)}</span
									>
								</div>
							{/each}
						</div>
						<div class="border-t border-white/10 pt-4 space-y-2">
							<div class="flex justify-between text-sm text-gray-400">
								<span>Subtotal</span><span>S/.{cartTotal.toFixed(2)}</span>
							</div>
							<div class="flex justify-between text-sm text-gray-400">
								<span>Envío</span><span class={shippingCost > 0 ? 'text-white' : 'text-green-400'}
									>{shippingCost > 0 ? `S/.${shippingCost.toFixed(2)}` : '--'}</span
								>
							</div>
							<div class="flex justify-between text-xl text-white font-bold pt-2">
								<span>Total</span><span>S/.{finalTotal.toFixed(2)}</span>
							</div>
						</div>

						<button
							on:click={createOrder}
							disabled={processing ||
								!!nameError ||
								!!emailError ||
								!!phoneError ||
								!contactName ||
								!contactEmail ||
								!contactPhone ||
								!selectedAddressId ||
								!selectedShippingId}
							class="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{processing ? 'Procesando...' : 'Continuar al Pago'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- MODAL DIRECCIÓN (SIN CAMBIOS) -->
{#if showAddressModal}
	<!-- ... mismo código del modal que ya tenías ... -->
	<div
		transition:fade
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
	>
		<div
			class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
		>
			<div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1437]/50">
				<h3 class="text-lg font-bold text-white">Nueva Dirección</h3>
				<button
					on:click={() => (showAddressModal = false)}
					class="text-gray-400 hover:text-white text-2xl">&times;</button
				>
			</div>
			<div class="p-6 space-y-4">
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Alias (Ej: Casa, Oficina)</label
					>
					<input
						type="text"
						bind:value={newAddress.alias}
						on:input={validateAlias}
						on:blur={validateAlias}
						placeholder="Casa"
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {aliasError
							? 'border-red-500 focus:border-red-500'
							: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
					/>
					{#if aliasError}<p class="text-red-400 text-xs mt-1">{aliasError}</p>{/if}
				</div>
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Dirección Exacta</label
					>
					<input
						type="text"
						bind:value={newAddress.linea1}
						on:input={validateAddressLine}
						on:blur={validateAddressLine}
						placeholder="Av. Larco 123, Dpto 401"
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {addressError
							? 'border-red-500 focus:border-red-500'
							: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
					/>
					{#if addressError}<p class="text-red-400 text-xs mt-1">{addressError}</p>{/if}
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Ciudad</label>
						<input
							type="text"
							bind:value={newAddress.ciudad}
							on:input={validateCity}
							on:blur={validateCity}
							placeholder="Lima"
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {cityError
								? 'border-red-500 focus:border-red-500'
								: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
						/>
						{#if cityError}<p class="text-red-400 text-xs mt-1">{cityError}</p>{/if}
					</div>
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Código Postal</label
						>
						<input
							type="text"
							value={newAddress.codigoPostal}
							on:input={handlePostalInput}
							on:blur={validatePostal}
							placeholder="15001"
							maxlength="7"
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {postalError
								? 'border-red-500 focus:border-red-500'
								: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
						/>
						{#if postalError}<p class="text-red-400 text-xs mt-1">{postalError}</p>{/if}
					</div>
				</div>
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Referencia</label>
					<input
						type="text"
						bind:value={newAddress.referencia}
						on:input={validateReference}
						on:blur={validateReference}
						placeholder="Frente al parque..."
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {referenceError
							? 'border-red-500 focus:border-red-500'
							: 'border-white/10 focus:border-blue-500'} outline-none transition-all"
					/>
					{#if referenceError}<p class="text-red-400 text-xs mt-1">{referenceError}</p>{/if}
				</div>
			</div>
			<div class="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#0b1437]/50">
				<button
					on:click={() => (showAddressModal = false)}
					class="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">Cancelar</button
				>
				<button
					on:click={saveNewAddress}
					disabled={!isAddressFormValid}
					class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
					>Guardar</button
				>
			</div>
		</div>
	</div>
{/if}
