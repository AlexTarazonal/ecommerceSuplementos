<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, slide } from 'svelte/transition';

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

	// --- ESTADO ---
	let user: any = null;
	let addresses: Address[] = [];
	let loading = true;
	let savingProfile = false;

	// Formulario Perfil
	let profileForm = {
		nombre: '',
		apellido: '',
		email: '',
		telefono: '',
		password: '' // Opcional
	};

	// Modal Dirección
	let showAddressModal = false;
	let isEditingAddress = false;
	let addressForm = {
		idDireccion: 0,
		alias: '',
		linea1: '',
		ciudad: '',
		codigoPostal: '',
		referencia: ''
	};

	// ERRORES VALIDACIÓN PERFIL
	let errors = { nombre: '', apellido: '', email: '', telefono: '', password: '' };

	// ERRORES VALIDACIÓN DIRECCIÓN
	let addrErrors = { alias: '', address: '', city: '', postal: '', reference: '' };

	// --- INICIALIZACIÓN ---
	onMount(async () => {
		const userStored = localStorage.getItem('usuario');
		const token = localStorage.getItem('token');

		if (!token || !userStored) {
			goto('/login');
			return;
		}

		user = JSON.parse(userStored);

		// Cargar datos al form
		profileForm = {
			nombre: user.nombre,
			apellido: user.apellido,
			email: user.email,
			telefono: user.telefono || '',
			password: ''
		};

		await fetchAddresses();
		loading = false;
	});

	async function fetchAddresses() {
		try {
			const res = await fetch(`http://localhost:4000/api/direcciones/${user.id}`);
			if (res.ok) addresses = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	// ============================================================
	// VALIDACIONES PERFIL
	// ============================================================

	function validateNameField(value: string, field: string) {
		const trimmed = value.trim();
		if (!trimmed) return `El ${field} es obligatorio.`;
		if (trimmed.length < 3) return 'Mínimo 3 caracteres.';
		if (trimmed.length > 16) return 'Máximo 16 caracteres.';

		// Solo letras y espacios (incluye tildes)
		if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(trimmed)) {
			return 'Solo se permiten letras y espacios.';
		}
		return '';
	}

	function handleNameInput() {
		errors.nombre = validateNameField(profileForm.nombre, 'nombre');
	}

	function handleSurnameInput() {
		errors.apellido = validateNameField(profileForm.apellido, 'apellido');
	}

	function validateEmail() {
		// Limpieza total de espacios
		profileForm.email = profileForm.email.trim().replace(/\s/g, '');
		const val = profileForm.email;

		if (!val) {
			errors.email = 'Obligatorio.';
			return;
		}

		// Regex estándar
		if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
			errors.email = 'Formato inválido.';
			return;
		}

		// Reglas específicas
		const atIndex = val.indexOf('@');
		const localPart = val.substring(0, atIndex);

		if (localPart.length < 3) {
			errors.email = 'Mínimo 3 caracteres antes del @.';
			return;
		}
		if (!/[a-zA-Z]/.test(localPart)) {
			errors.email = 'Debe tener al menos una letra antes del @.';
			return;
		}

		errors.email = '';
	}

	function handlePhoneInput(e: Event) {
		const target = e.target as HTMLInputElement;
		// Solo números
		target.value = target.value.replace(/\D/g, '');
		profileForm.telefono = target.value;

		validatePhone();
	}

	function validatePhone() {
		const val = profileForm.telefono;
		if (!val) {
			errors.telefono = 'Obligatorio.';
			return;
		}
		if (val.length !== 9) {
			errors.telefono = 'Debe tener exactamente 9 dígitos.';
			return;
		}
		errors.telefono = '';
	}

	function validatePassword() {
		// Limpieza espacios
		profileForm.password = profileForm.password.trim().replace(/\s/g, '');
		const val = profileForm.password;

		// Si está vacío y NO estamos editando (es decir, es opcional en update), pasamos.
		// PERO la regla dice "No puede estar vacía". Asumimos que si el usuario *intenta* cambiarla (escribe algo), aplica la regla.
		// Si lo deja en blanco al actualizar perfil, significa "no cambiar".
		if (!val) {
			errors.password = '';
			return;
		}

		if (val.length < 5) {
			errors.password = 'Min 5 chars.';
			return;
		}
		if (val.length > 16) {
			errors.password = 'Max 16 chars.';
			return;
		}

		if (!/[a-zA-Z]/.test(val)) {
			errors.password = 'Debe tener letra.';
			return;
		}
		// Caracteres prohibidos (exóticos)
		if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) {
			errors.password = 'Caracteres inválidos.';
			return;
		}

		errors.password = '';
	}

	// Helper para botón Perfil
	$: isProfileValid =
		!errors.nombre &&
		profileForm.nombre &&
		!errors.apellido &&
		profileForm.apellido &&
		!errors.email &&
		profileForm.email &&
		!errors.telefono &&
		profileForm.telefono &&
		!errors.password; // Password puede ser string vacio (ok) o valido

	// ============================================================
	// VALIDACIONES DIRECCIÓN
	// ============================================================

	// 1. ALIAS
	function validateAlias() {
		const val = addressForm.alias.trim();
		if (!val) {
			addrErrors.alias = 'Obligatorio.';
			return;
		}
		if (val.length < 3) {
			addrErrors.alias = 'Min 3 chars.';
			return;
		}
		if (val.length > 16) {
			addrErrors.alias = 'Max 16 chars.';
			return;
		}
		if (/[0-9]/.test(val)) {
			addrErrors.alias = 'No números.';
			return;
		}
		if (/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/.test(val)) {
			addrErrors.alias = 'No símbolos.';
			return;
		}
		addrErrors.alias = '';
	}

	// 2. DIRECCIÓN EXACTA
	function validateAddressLine() {
		const val = addressForm.linea1.trim();
		if (!val) {
			addrErrors.address = 'Obligatorio.';
			return;
		}
		if (val.length < 3) {
			addrErrors.address = 'Min 3 chars.';
			return;
		}
		if (val.length > 32) {
			addrErrors.address = 'Max 32 chars.';
			return;
		}

		// Solo números?
		if (/^[0-9\s.,]+$/.test(val)) {
			addrErrors.address = 'No puede ser solo números.';
			return;
		}
		// Solo signos?
		if (/^[.,\s]+$/.test(val)) {
			addrErrors.address = 'No puede ser solo signos.';
			return;
		}
		// Caracteres permitidos
		if (/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s.,]/.test(val)) {
			addrErrors.address = 'Caracteres inválidos.';
			return;
		}

		addrErrors.address = '';
	}

	// 3. CIUDAD
	function validateCity() {
		const val = addressForm.ciudad.trim();
		if (!val) {
			addrErrors.city = 'Obligatorio.';
			return;
		}
		if (val.length < 3) {
			addrErrors.city = 'Min 3 chars.';
			return;
		}
		if (val.length > 16) {
			addrErrors.city = 'Max 16 chars.';
			return;
		}

		if (/[0-9]/.test(val)) {
			addrErrors.city = 'No números.';
			return;
		}
		// "no pueda poner espacios" -> Asumo que no permite espacios en absoluto
		if (/\s/.test(val)) {
			addrErrors.city = 'No se permiten espacios.';
			return;
		}
		if (/[^a-zA-ZñÑáéíóúÁÉÍÓÚ]/.test(val)) {
			addrErrors.city = 'Solo letras.';
			return;
		}

		addrErrors.city = '';
	}

	// 4. CÓDIGO POSTAL
	function handlePostalInput(e: Event) {
		const t = e.target as HTMLInputElement;
		t.value = t.value.replace(/\D/g, '').slice(0, 7);
		addressForm.codigoPostal = t.value;
		validatePostal();
	}
	function validatePostal() {
		if (addressForm.codigoPostal.length < 3) {
			addrErrors.postal = 'Min 3 dígitos.';
			return;
		}
		addrErrors.postal = '';
	}

	// 5. REFERENCIA
	function validateReference() {
		const val = addressForm.referencia.trim();
		if (!val) {
			addrErrors.reference = 'Obligatorio.';
			return;
		}
		if (val.length < 5) {
			addrErrors.reference = 'Min 5 chars.';
			return;
		}
		if (val.length > 32) {
			addrErrors.reference = 'Max 32 chars.';
			return;
		}
		if (/[0-9]/.test(val)) {
			addrErrors.reference = 'No números.';
			return;
		}
		if (/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/.test(val)) {
			addrErrors.reference = 'Solo letras y espacios.';
			return;
		}

		addrErrors.reference = '';
	}

	// Helper botón dirección
	$: isAddressValid =
		!addrErrors.alias &&
		addressForm.alias &&
		!addrErrors.address &&
		addressForm.linea1 &&
		!addrErrors.city &&
		addressForm.ciudad &&
		!addrErrors.postal &&
		addressForm.codigoPostal &&
		!addrErrors.reference &&
		addressForm.referencia;

	// ============================================================
	// ACCIONES
	// ============================================================

	async function updateProfile() {
		// Limpieza final antes de enviar
		const payload = {
			...profileForm,
			nombre: profileForm.nombre.trim(),
			apellido: profileForm.apellido.trim(),
			email: profileForm.email.trim(),
			telefono: profileForm.telefono.trim(),
			password: profileForm.password.trim()
		};

		savingProfile = true;
		try {
			const res = await fetch(`http://localhost:4000/api/cliente/profile/${user.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await res.json();

			if (res.ok) {
				alert('Perfil actualizado correctamente.');
				localStorage.setItem('usuario', JSON.stringify({ ...user, ...data.user }));
				user = { ...user, ...data.user };
				profileForm.password = '';
			} else {
				alert('Error: ' + data.message);
			}
		} catch (e) {
			alert('Error de conexión');
		} finally {
			savingProfile = false;
		}
	}

	function openAddressModal(addr: Address | null = null) {
		if (addr) {
			isEditingAddress = true;
			addressForm = { ...addr };
			// Validar al abrir para no mostrar errores si ya es correcto, o mostrar si algo está mal de antes
			validateAlias();
			validateAddressLine();
			validateCity();
			validatePostal();
			validateReference();
			// Limpiamos errores visuales iniciales (opcional, pero mejor UX empezar limpio)
			addrErrors = { alias: '', address: '', city: '', postal: '', reference: '' };
		} else {
			if (addresses.length >= 5) return alert('Has alcanzado el límite máximo de 5 direcciones.');
			isEditingAddress = false;
			addressForm = {
				idDireccion: 0,
				alias: '',
				linea1: '',
				ciudad: '',
				codigoPostal: '',
				referencia: ''
			};
			addrErrors = { alias: '', address: '', city: '', postal: '', reference: '' };
		}
		showAddressModal = true;
	}

	async function saveAddress() {
		// Validación final (Trim)
		addressForm.alias = addressForm.alias.trim();
		addressForm.linea1 = addressForm.linea1.trim();
		addressForm.ciudad = addressForm.ciudad.trim();
		addressForm.referencia = addressForm.referencia.trim();

		// Ejecutar todas las validaciones
		validateAlias();
		validateAddressLine();
		validateCity();
		validatePostal();
		validateReference();
		if (!isAddressValid) return;

		const endpoint = 'http://localhost:4000/api/direcciones';
		const method = isEditingAddress ? 'PUT' : 'POST';
		const url = isEditingAddress ? `${endpoint}/${addressForm.idDireccion}` : endpoint;

		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idUsuario: user.id, ...addressForm })
			});

			if (res.ok) {
				await fetchAddresses();
				showAddressModal = false;
			} else {
				alert('Error al guardar dirección');
			}
		} catch (e) {
			alert('Error de conexión');
		}
	}

	async function deleteAddress(id: number) {
		if (!confirm('¿Eliminar esta dirección?')) return;
		try {
			await fetch(`http://localhost:4000/api/direcciones/${id}`, { method: 'DELETE' });
			await fetchAddresses();
		} catch (e) {
			alert('Error al eliminar');
		}
	}
</script>

<div class="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden">
	<!-- Fondo Vision UI -->
	<div class="fixed inset-0 bg-[#0f172a] -z-20"></div>
	<div
		class="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-purple-900/20 rounded-full blur-[180px] pointer-events-none -z-10"
	></div>
	<div
		class="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[150px] pointer-events-none -z-10"
	></div>

	<div class="max-w-4xl mx-auto space-y-8">
		<!-- SECCIÓN 1: DATOS PERSONALES -->
		<section
			class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
		>
			<h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
				<span class="p-2 rounded-lg bg-blue-500/20 text-blue-400"
					><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						></path></svg
					></span
				>
				Mis Datos Personales
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Nombre -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre</label>
					<input
						type="text"
						bind:value={profileForm.nombre}
						on:input={handleNameInput}
						on:blur={handleNameInput}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.nombre
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none transition-all"
					/>
					{#if errors.nombre}<p class="text-red-400 text-xs mt-1">{errors.nombre}</p>{/if}
				</div>

				<!-- Apellido -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Apellido</label>
					<input
						type="text"
						bind:value={profileForm.apellido}
						on:input={handleSurnameInput}
						on:blur={handleSurnameInput}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.apellido
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none transition-all"
					/>
					{#if errors.apellido}<p class="text-red-400 text-xs mt-1">{errors.apellido}</p>{/if}
				</div>

				<!-- Email -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Correo Electrónico</label
					>
					<input
						type="email"
						bind:value={profileForm.email}
						on:input={validateEmail}
						on:blur={validateEmail}
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.email
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none transition-all"
					/>
					{#if errors.email}<p class="text-red-400 text-xs mt-1">{errors.email}</p>{/if}
				</div>

				<!-- Teléfono -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Teléfono</label>
					<input
						type="tel"
						value={profileForm.telefono}
						on:input={handlePhoneInput}
						on:blur={validatePhone}
						maxlength="9"
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.telefono
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none transition-all"
					/>
					{#if errors.telefono}<p class="text-red-400 text-xs mt-1">{errors.telefono}</p>{/if}
				</div>

				<!-- Contraseña -->
				<div class="md:col-span-2">
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Cambiar Contraseña (Opcional)</label
					>
					<input
						type="password"
						bind:value={profileForm.password}
						on:input={validatePassword}
						on:blur={validatePassword}
						placeholder="••••••••"
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {errors.password
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none transition-all"
					/>
					{#if errors.password}<p class="text-red-400 text-xs mt-1">{errors.password}</p>{/if}
				</div>
			</div>

			<div class="mt-8 flex justify-end">
				<button
					on:click={updateProfile}
					disabled={savingProfile || !isProfileValid}
					class="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{savingProfile ? 'Guardando...' : 'Actualizar Datos'}
				</button>
			</div>
		</section>

		<!-- SECCIÓN 2: DIRECCIONES -->
		<section
			class="bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
		>
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-bold text-white flex items-center gap-3">
					<span class="p-2 rounded-lg bg-purple-500/20 text-purple-400"
						><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
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
					>
					Mis Direcciones
					<span class="text-sm text-gray-500 font-normal ml-2">({addresses.length}/5)</span>
				</h2>

				{#if addresses.length < 5}
					<button
						on:click={() => openAddressModal()}
						class="px-4 py-2 bg-[#0b1437] hover:bg-white/10 border border-white/10 rounded-xl text-blue-400 text-sm font-bold transition-all"
					>
						+ Agregar
					</button>
				{:else}
					<span
						class="text-xs text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20"
						>Límite alcanzado</span
					>
				{/if}
			</div>

			{#if addresses.length === 0}
				<p class="text-gray-500 text-center py-8">No tienes direcciones guardadas.</p>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each addresses as addr}
						<div
							class="bg-[#0b1437]/50 border border-white/5 rounded-2xl p-5 flex justify-between items-start group hover:border-blue-500/30 transition-colors"
						>
							<div>
								<div class="flex items-center gap-2 mb-1">
									<h4 class="text-white font-bold">{addr.alias}</h4>
									{#if addr.esPrincipal}<span
											class="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 rounded font-bold uppercase"
											>Principal</span
										>{/if}
								</div>
								<p class="text-gray-400 text-sm text-sm">{addr.linea1}</p>
								<p class="text-gray-500 text-xs">{addr.ciudad}, {addr.codigoPostal}</p>
							</div>
							<div class="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									on:click={() => openAddressModal(addr)}
									class="p-1.5 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition"
									><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
										></path></svg
									></button
								>
								<button
									on:click={() => deleteAddress(addr.idDireccion)}
									class="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition"
									><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										></path></svg
									></button
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

<!-- MODAL DIRECCIÓN -->
{#if showAddressModal}
	<div
		transition:fade
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
	>
		<div
			class="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
		>
			<div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1437]/50">
				<h3 class="text-lg font-bold text-white">
					{isEditingAddress ? 'Editar' : 'Nueva'} Dirección
				</h3>
				<button
					on:click={() => (showAddressModal = false)}
					class="text-gray-400 hover:text-white text-2xl">&times;</button
				>
			</div>
			<div class="p-6 space-y-4">
				<!-- ALIAS -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Alias</label>
					<input
						type="text"
						bind:value={addressForm.alias}
						on:input={validateAlias}
						on:blur={validateAlias}
						placeholder="Casa"
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {addrErrors.alias
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if addrErrors.alias}<p class="text-red-400 text-xs mt-1">{addrErrors.alias}</p>{/if}
				</div>

				<!-- DIRECCIÓN -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2"
						>Dirección Exacta</label
					>
					<input
						type="text"
						bind:value={addressForm.linea1}
						on:input={validateAddressLine}
						on:blur={validateAddressLine}
						placeholder="Av. Larco 123"
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {addrErrors.address
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if addrErrors.address}<p class="text-red-400 text-xs mt-1">{addrErrors.address}</p>{/if}
				</div>

				<div class="grid grid-cols-2 gap-4">
					<!-- CIUDAD -->
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Ciudad</label>
						<input
							type="text"
							bind:value={addressForm.ciudad}
							on:input={validateCity}
							on:blur={validateCity}
							placeholder="Lima"
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {addrErrors.city
								? 'border-red-500'
								: 'border-white/10'} focus:border-blue-500 outline-none"
						/>
						{#if addrErrors.city}<p class="text-red-400 text-xs mt-1">{addrErrors.city}</p>{/if}
					</div>
					<!-- POSTAL -->
					<div>
						<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Código Postal</label
						>
						<input
							type="text"
							value={addressForm.codigoPostal}
							on:input={handlePostalInput}
							on:blur={validatePostal}
							placeholder="15001"
							maxlength="7"
							class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {addrErrors.postal
								? 'border-red-500'
								: 'border-white/10'} focus:border-blue-500 outline-none"
						/>
						{#if addrErrors.postal}<p class="text-red-400 text-xs mt-1">{addrErrors.postal}</p>{/if}
					</div>
				</div>

				<!-- REFERENCIA -->
				<div>
					<label class="block text-xs font-bold text-gray-400 uppercase mb-2">Referencia</label>
					<input
						type="text"
						bind:value={addressForm.referencia}
						on:input={validateReference}
						on:blur={validateReference}
						placeholder="Frente al parque..."
						class="w-full bg-[#0b1437] text-white rounded-xl px-4 py-3 border {addrErrors.reference
							? 'border-red-500'
							: 'border-white/10'} focus:border-blue-500 outline-none"
					/>
					{#if addrErrors.reference}<p class="text-red-400 text-xs mt-1">
							{addrErrors.reference}
						</p>{/if}
				</div>
			</div>
			<div class="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#0b1437]/50">
				<button
					on:click={() => (showAddressModal = false)}
					class="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white">Cancelar</button
				>
				<button
					on:click={saveAddress}
					disabled={!isAddressValid}
					class="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
					>Guardar</button
				>
			</div>
		</div>
	</div>
{/if}
