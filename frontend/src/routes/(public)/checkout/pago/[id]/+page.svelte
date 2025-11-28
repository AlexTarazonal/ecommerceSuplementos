<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { clearCart } from '$lib/cart';
	import { fade, slide } from 'svelte/transition';

	// ID del pedido desde la URL
	$: orderId = $page.params.id;

	let order: any = null;
	let loading = true;
	let processing = false;
	let paymentMethod = 'Tarjeta';

	// Datos de tarjeta
	let cardData = { number: '', name: '', expiry: '', cvv: '' };

	// Errores de validación
	let errors = { number: '', name: '', expiry: '', cvv: '' };

	onMount(async () => {
		if (!orderId) {
			alert('Pedido no válido.');
			goto('/tienda');
			return;
		}
		await fetchOrder();
	});

	async function fetchOrder() {
		try {
			const res = await fetch(`http://localhost:4000/api/shop/orders/${orderId}`);
			if (res.ok) {
				order = await res.json();

				if (order.idEstadoPedido !== 1) {
					alert('Esta orden ya ha sido procesada.');
					goto(`/checkout/confirmacion/${orderId}`);
				}
			} else {
				alert('Pedido no encontrado');
				goto('/tienda');
			}
		} catch (e) {
			console.error(e);
			alert('Error de conexión');
		} finally {
			loading = false;
		}
	}

	// --- VALIDACIONES EN TIEMPO REAL ---

	function validateCardNumber() {
		const clean = cardData.number.replace(/\D/g, '');
		if (clean.length !== 16) {
			errors.number = 'Debe tener 16 dígitos.';
		} else {
			errors.number = '';
		}
	}

	function validateCardName() {
		const clean = cardData.name.trim();
		if (clean.length < 3) {
			errors.name = 'Mínimo 3 caracteres.';
		} else if (clean.length > 16) {
			errors.name = 'Máximo 16 caracteres.';
		} else if (!/^[a-zA-Z\s]+$/.test(clean)) {
			errors.name = 'Solo letras y espacios.';
		} else {
			errors.name = '';
		}
	}

	function validateExpiry() {
		if (cardData.expiry.length !== 5) {
			errors.expiry = 'Formato MM/YY incompleto.';
			return;
		}

		const [mm, yy] = cardData.expiry.split('/').map(Number);

		// Validar Mes
		if (!mm || mm < 1 || mm > 12) {
			errors.expiry = 'Mes inválido (01-12).';
			return;
		}

		// Validar Año (Dinámico)
		const currentYearFull = new Date().getFullYear();
		const currentYearShort = currentYearFull % 100; // ej: 24 o 25
		const minYear = currentYearShort + 1; // Mínimo 1 año más
		const maxYear = currentYearShort + 7; // Máximo 7 años

		if (!yy) {
			errors.expiry = 'Año inválido.';
		} else if (yy < minYear) {
			errors.expiry = `Año muy antiguo (min ${minYear}).`;
		} else if (yy > maxYear) {
			errors.expiry = `Año muy lejano (max ${maxYear}).`;
		} else {
			errors.expiry = '';
		}
	}

	function validateCvv() {
		if (cardData.cvv.length !== 3) {
			errors.cvv = 'Debe tener 3 dígitos.';
		} else {
			errors.cvv = '';
		}
	}

	// --- MANEJO DE INPUTS ---

	function handleCardInput(e: Event) {
		const target = e.target as HTMLInputElement;
		target.value = target.value.replace(/\D/g, '').slice(0, 16);
		cardData.number = target.value;
		validateCardNumber();
	}

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		// Solo letras y espacios, mayúsculas
		target.value = target.value
			.replace(/[^a-zA-Z\s]/g, '')
			.toUpperCase()
			.slice(0, 16);
		cardData.name = target.value;
		validateCardName();
	}

	function handleExpiryInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const inputType = (e as InputEvent).inputType; // Detectar si está borrando
		let val = target.value.replace(/\D/g, ''); // Solo números

		// Lógica inteligente para la barra /
		if (val.length >= 2 && inputType !== 'deleteContentBackward') {
			val = val.slice(0, 2) + '/' + val.slice(2);
		}

		// Limitar a 5 caracteres (MM/YY)
		target.value = val.slice(0, 5);
		cardData.expiry = target.value;

		validateExpiry();
	}

	function handleCvvInput(e: Event) {
		const target = e.target as HTMLInputElement;
		target.value = target.value.replace(/\D/g, '').slice(0, 3);
		cardData.cvv = target.value;
		validateCvv();
	}

	// --- PAGO ---

	async function handlePayment() {
		// Validación final antes de enviar (doble check)
		if (paymentMethod === 'Tarjeta') {
			validateCardNumber();
			validateCardName();
			validateExpiry();
			validateCvv();

			if (
				errors.number ||
				errors.name ||
				errors.expiry ||
				errors.cvv ||
				!cardData.number ||
				!cardData.name ||
				!cardData.expiry ||
				!cardData.cvv
			) {
				return; // No hacemos nada, los errores ya se muestran
			}
		}

		processing = true;

		try {
			const res = await fetch('http://localhost:4000/api/shop/pay', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					idPedido: orderId,
					metodoPago: paymentMethod
				})
			});

			if (res.ok) {
				clearCart();
				goto(`/checkout/confirmacion/${orderId}`);
			} else {
				alert('Error al procesar el pago.');
			}
		} catch (e) {
			console.error(e);
			alert('Error de conexión');
		} finally {
			processing = false;
		}
	}

	// Helper para deshabilitar botón
	$: isFormInvalid =
		paymentMethod === 'Tarjeta' &&
		(!!errors.number ||
			!!errors.name ||
			!!errors.expiry ||
			!!errors.cvv ||
			!cardData.number ||
			!cardData.name ||
			!cardData.expiry ||
			!cardData.cvv);
</script>

<div class="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
	<div class="fixed inset-0 bg-[#0f172a] -z-20"></div>
	<div
		class="fixed top-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-900/20 rounded-full blur-[180px] pointer-events-none -z-10"
	></div>
	<div
		class="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[150px] pointer-events-none -z-10"
	></div>

	<div class="max-w-6xl mx-auto">
		<!-- Breadcrumb -->
		<div class="flex justify-center mb-12">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2 text-green-400">
					<div
						class="w-8 h-8 rounded-full bg-green-600/20 border border-green-500 flex items-center justify-center text-green-400 font-bold"
					>
						✓
					</div>
					<span class="font-bold text-sm uppercase tracking-wider">Datos</span>
				</div>
				<div class="w-16 h-0.5 bg-blue-500"></div>
				<div class="flex items-center gap-2 text-blue-400">
					<div
						class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/50"
					>
						2
					</div>
					<span class="font-bold text-sm uppercase tracking-wider">Pago</span>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div
					class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
				></div>
			</div>
		{:else if order}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8" in:fade>
				<!-- COLUMNA IZQUIERDA: MÉTODO DE PAGO -->
				<div class="lg:col-span-2 space-y-6">
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
										d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
									></path></svg
								></span
							>
							Selecciona tu método de pago
						</h3>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
							<!-- Opción Tarjeta -->
							<div
								class="cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col gap-4 relative overflow-hidden group
                                {paymentMethod === 'Tarjeta'
									? 'bg-blue-600/20 border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)]'
									: 'bg-[#0b1437] border-white/5 hover:border-white/20'}"
								on:click={() => (paymentMethod = 'Tarjeta')}
							>
								<div class="flex justify-between items-start">
									<span class="font-bold text-white">Tarjeta de Crédito</span>
									<div
										class="w-5 h-5 rounded-full border-2 flex items-center justify-center {paymentMethod ===
										'Tarjeta'
											? 'border-blue-500'
											: 'border-gray-600'}"
									>
										{#if paymentMethod === 'Tarjeta'}<div
												class="w-2.5 h-2.5 bg-blue-500 rounded-full"
											></div>{/if}
									</div>
								</div>
								<div class="flex gap-2 mt-2">
									<div class="w-8 h-5 bg-white/10 rounded"></div>
									<div class="w-8 h-5 bg-white/10 rounded"></div>
								</div>
							</div>

							<!-- Opción PayPal -->
							<div
								class="cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col gap-4 relative overflow-hidden group
                                {paymentMethod === 'PayPal'
									? 'bg-blue-400/20 border-[#0070ba] shadow-[0_0_30px_rgba(0,112,186,0.3)]'
									: 'bg-[#0b1437] border-white/5 hover:border-white/20'}"
								on:click={() => (paymentMethod = 'PayPal')}
							>
								<div class="flex justify-between items-start">
									<span class="font-bold text-white">PayPal</span>
									<div
										class="w-5 h-5 rounded-full border-2 flex items-center justify-center {paymentMethod ===
										'PayPal'
											? 'border-[#0070ba]'
											: 'border-gray-600'}"
									>
										{#if paymentMethod === 'PayPal'}<div
												class="w-2.5 h-2.5 bg-[#0070ba] rounded-full"
											></div>{/if}
									</div>
								</div>
								<span class="text-xs text-gray-400 mt-2">Serás redirigido a PayPal.</span>
							</div>
						</div>

						<!-- FORMULARIO TARJETA -->
						{#if paymentMethod === 'Tarjeta'}
							<div transition:slide class="space-y-4 pt-4 border-t border-white/10">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<!-- NÚMERO DE TARJETA -->
									<div>
										<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
											>Número de Tarjeta</label
										>
										<input
											type="text"
											value={cardData.number}
											on:input={handleCardInput}
											on:blur={validateCardNumber}
											placeholder="0000 0000 0000 0000"
											maxlength="16"
											class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.number
												? 'border-red-500'
												: 'border-white/10'} focus:border-blue-500 outline-none tracking-widest transition-all"
										/>
										{#if errors.number}<p class="text-red-400 text-xs mt-1 ml-1">
												{errors.number}
											</p>{/if}
									</div>

									<!-- NOMBRE TITULAR -->
									<div>
										<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
											>Nombre en la Tarjeta</label
										>
										<input
											type="text"
											value={cardData.name}
											on:input={handleNameInput}
											on:blur={validateCardName}
											placeholder="JUAN PEREZ"
											class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.name
												? 'border-red-500'
												: 'border-white/10'} focus:border-blue-500 outline-none uppercase transition-all"
										/>
										{#if errors.name}<p class="text-red-400 text-xs mt-1 ml-1">
												{errors.name}
											</p>{/if}
									</div>

									<!-- EXPIRACIÓN -->
									<div>
										<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
											>Expiración (MM/YY)</label
										>
										<input
											type="text"
											value={cardData.expiry}
											on:input={handleExpiryInput}
											placeholder="MM/YY"
											maxlength="5"
											class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.expiry
												? 'border-red-500'
												: 'border-white/10'} focus:border-blue-500 outline-none transition-all"
										/>
										{#if errors.expiry}<p class="text-red-400 text-xs mt-1 ml-1">
												{errors.expiry}
											</p>{/if}
									</div>

									<!-- CVV -->
									<div>
										<label class="block text-xs font-bold text-gray-400 uppercase mb-2">CVV</label>
										<input
											type="password"
											value={cardData.cvv}
											on:input={handleCvvInput}
											on:blur={validateCvv}
											placeholder="123"
											maxlength="3"
											class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.cvv
												? 'border-red-500'
												: 'border-white/10'} focus:border-blue-500 outline-none transition-all"
										/>
										{#if errors.cvv}<p class="text-red-400 text-xs mt-1 ml-1">{errors.cvv}</p>{/if}
									</div>
								</div>
								<div class="flex items-center gap-2 text-xs text-gray-500 mt-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
										></path></svg
									>
									Pagos encriptados y seguros.
								</div>
							</div>
						{/if}
					</section>
				</div>

				<!-- COLUMNA DERECHA: RESUMEN FINAL -->
				<div class="lg:col-span-1">
					<div
						class="bg-[#0f172a]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-32"
					>
						<h4 class="text-lg font-bold text-white mb-4">Resumen del Pedido</h4>

						<div class="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
							{#each order.items as item}
								<div class="flex justify-between items-start text-sm border-b border-white/5 pb-2">
									<div class="text-gray-400 w-2/3">
										<span class="text-white font-bold">{item.cantidad}x</span>
										{item.nombreProducto}
									</div>
									<span class="text-white font-bold"
										>S/.{(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</span
									>
								</div>
							{/each}
						</div>

						<div class="pt-2 space-y-2">
							<div class="flex justify-between text-sm text-gray-400">
								<span>Subtotal</span>
								<span>S/.{Number(order.subtotal).toFixed(2)}</span>
							</div>
							<div class="flex justify-between text-sm text-gray-400">
								<span>Envío ({order.metodoEnvio})</span>
								<span class="text-white">S/.{Number(order.costoEnvio).toFixed(2)}</span>
							</div>
							<div
								class="flex justify-between text-xl text-white font-bold pt-4 border-t border-white/10"
							>
								<span>Total a Pagar</span>
								<span>S/.{Number(order.total).toFixed(2)}</span>
							</div>
						</div>

						<button
							on:click={handlePayment}
							disabled={processing || isFormInvalid}
							class="w-full mt-6 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-green-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
						>
							{processing ? 'Procesando...' : `Pagar S/.${Number(order.total).toFixed(2)}`}
						</button>

						<p class="text-[10px] text-center text-gray-500 mt-4">
							Al confirmar, aceptas nuestros términos y condiciones.
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
