<script lang="ts">
	import { goto } from '$app/navigation';

	// Variables del formulario
	let nombre = '';
	let apellido = '';
	let email = '';
	let telefono = '';
	let password = '';

	// Variables de estado
	let loading = false;
	let errorMessage = '';
	let successMessage = '';

	// Variables de error para validación en tiempo real
	let nombreError = '';
	let apellidoError = '';
	let emailError = '';
	let telefonoError = '';
	let passwordError = '';

	// --- 1. VALIDACIÓN DE NOMBRE Y APELLIDO ---
	// CORRECCIÓN: Tipado explícito de parámetros
	function validateText(value: string, fieldName: string) {
		// Limpiar espacios extremos
		const trimmed = value.trim();

		if (!trimmed) return `El ${fieldName} es obligatorio.`;

		if (trimmed.length < 3) return `Mínimo 3 caracteres.`;
		if (trimmed.length > 16) return `Máximo 16 caracteres.`;

		// Regex: Solo letras (a-z, A-Z) y vocales con tilde/ñ + espacios
		const textRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/;
		if (!textRegex.test(trimmed)) {
			return `No se permiten números ni símbolos.`;
		}

		return '';
	}

	function handleNameInput() {
		nombreError = validateText(nombre, 'nombre');
	}

	function handleSurnameInput() {
		apellidoError = validateText(apellido, 'apellido');
	}

	// --- 2. VALIDACIÓN DE EMAIL ---
	function validateEmail() {
		// Limpieza automática de espacios
		email = email.trim().replace(/\s/g, '');

		if (!email) {
			emailError = 'El correo es obligatorio.';
			return false;
		}
		if (email.length < 5) {
			emailError = 'El correo es muy corto.';
			return false;
		}
		if (!/[a-zA-Z]/.test(email)) {
			emailError = 'Debe contener al menos una letra.';
			return false;
		}

		const localPart = email.slice(0, -10);

		if (localPart.length < 3) {
			emailError = 'Mínimo 3 caracteres antes del @.';
			return false;
		}

		// Regex estricto estándar
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
			emailError = 'Formato inválido (ej: a@b.co).';
			return false;
		}

		emailError = '';
		return true;
	}

	// --- 3. VALIDACIÓN DE TELÉFONO ---
	// CORRECCIÓN: Tipado del evento y casting del target
	function handlePhoneInput(e: Event) {
		const target = e.target as HTMLInputElement;
		// Eliminar cualquier caracter que no sea número
		target.value = target.value.replace(/\D/g, '');
		telefono = target.value;

		validatePhone();
	}

	function validatePhone() {
		const phoneClean = telefono.trim();

		if (!phoneClean) {
			telefonoError = 'El teléfono es obligatorio.';
			return false;
		}

		if (phoneClean.length !== 9) {
			telefonoError = 'Debe tener exactamente 9 dígitos.';
			return false;
		}

		telefonoError = '';
		return true;
	}

	// --- 4. VALIDACIÓN DE CONTRASEÑA ---
	function validatePassword() {
		password = password.trim().replace(/\s/g, '');

		if (!password) {
			passwordError = 'La contraseña es obligatoria.';
			return false;
		}
		if (password.length < 5) {
			passwordError = 'Mínimo 5 caracteres.';
			return false;
		}
		if (password.length > 16) {
			passwordError = 'Máximo 16 caracteres.';
			return false;
		}
		// Complejidad
		if (!/[a-zA-Z]/.test(password)) {
			passwordError = 'Debe contener al menos una letra.';
			return false;
		}
		// Caracteres permitidos (ASCII estándar)
		if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
			passwordError = 'Caracteres no permitidos.';
			return false;
		}

		passwordError = '';
		return true;
	}

	// --- REGISTRO ---
	async function handleRegister() {
		handleNameInput();
		handleSurnameInput();
		const isEmailValid = validateEmail();
		const isPhoneValid = validatePhone();
		const isPassValid = validatePassword();

		// CORRECCIÓN: Usar !! para convertir strings de error a booleanos verdaderos
		if (!!nombreError || !!apellidoError || !isEmailValid || !isPhoneValid || !isPassValid) {
			return;
		}

		loading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('http://localhost:4000/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nombre: nombre.trim(),
					apellido: apellido.trim(),
					email,
					telefono,
					password
				})
			});

			const data = await response.json();

			if (response.ok) {
				successMessage = '¡Cuenta creada exitosamente! Redirigiendo...';
				setTimeout(() => {
					goto('/login');
				}, 2000);
			} else {
				errorMessage = data.message || 'Error al registrarse';
			}
		} catch (error) {
			errorMessage = 'Error de conexión con el servidor';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex items-center justify-center min-h-screen w-full px-4 py-10">
	<div
		class="relative w-full max-w-lg p-8 rounded-3xl border border-white/10 bg-vision-card backdrop-blur-xl shadow-2xl"
	>
		<!-- Icono Decorativo -->
		<div class="absolute -top-10 left-1/2 -translate-x-1/2">
			<div
				class="w-20 h-20 bg-vision-primary rounded-2xl shadow-[0_0_50px_rgba(0,117,255,0.6)] flex items-center justify-center transform rotate-12"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-10 h-10 text-white -rotate-12"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
					/>
				</svg>
			</div>
		</div>

		<div class="mt-8 text-center">
			<h2 class="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
			<p class="text-gray-400 text-sm">Únete a SupleStore y mejora tu rendimiento</p>
		</div>

		<!-- Mensaje de Error -->
		{#if errorMessage}
			<div
				class="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center animate-pulse"
			>
				{errorMessage}
			</div>
		{/if}

		<!-- Mensaje de Éxito -->
		{#if successMessage}
			<div
				class="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm text-center animate-bounce"
			>
				{successMessage}
			</div>
		{/if}

		<form on:submit|preventDefault={handleRegister} class="mt-8 space-y-5">
			<div class="grid grid-cols-2 gap-4">
				<!-- NOMBRE -->
				<div class="group">
					<label class="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
						>Nombre</label
					>
					<input
						type="text"
						bind:value={nombre}
						on:input={handleNameInput}
						on:blur={handleNameInput}
						class="w-full px-4 py-3 bg-[#0f172a]/50 border {nombreError
							? 'border-red-500 focus:border-red-500'
							: 'border-gray-700 focus:border-vision-primary'} rounded-xl text-white focus:outline-none focus:ring-1 {nombreError
							? 'focus:ring-red-500'
							: 'focus:ring-vision-primary'} transition-all placeholder-gray-600"
						placeholder="Juan"
					/>
					{#if nombreError}
						<p class="text-red-400 text-xs mt-1 ml-1">{nombreError}</p>
					{/if}
				</div>

				<!-- APELLIDO -->
				<div class="group">
					<label class="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
						>Apellido</label
					>
					<input
						type="text"
						bind:value={apellido}
						on:input={handleSurnameInput}
						on:blur={handleSurnameInput}
						class="w-full px-4 py-3 bg-[#0f172a]/50 border {apellidoError
							? 'border-red-500 focus:border-red-500'
							: 'border-gray-700 focus:border-vision-primary'} rounded-xl text-white focus:outline-none focus:ring-1 {apellidoError
							? 'focus:ring-red-500'
							: 'focus:ring-vision-primary'} transition-all placeholder-gray-600"
						placeholder="Pérez"
					/>
					{#if apellidoError}
						<p class="text-red-400 text-xs mt-1 ml-1">{apellidoError}</p>
					{/if}
				</div>
			</div>

			<!-- EMAIL -->
			<div>
				<label class="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
					>Correo Electrónico</label
				>
				<input
					type="email"
					bind:value={email}
					on:input={validateEmail}
					on:blur={validateEmail}
					class="w-full px-4 py-3 bg-[#0f172a]/50 border {emailError
						? 'border-red-500 focus:border-red-500'
						: 'border-gray-700 focus:border-vision-primary'} rounded-xl text-white focus:outline-none focus:ring-1 {emailError
						? 'focus:ring-red-500'
						: 'focus:ring-vision-primary'} transition-all placeholder-gray-600"
					placeholder="ejemplo@correo.com"
				/>
				{#if emailError}
					<p class="text-red-400 text-xs mt-1 ml-1">{emailError}</p>
				{/if}
			</div>

			<!-- TELÉFONO -->
			<div>
				<label class="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
					>Teléfono (9 dígitos)</label
				>
				<input
					type="tel"
					value={telefono}
					on:input={handlePhoneInput}
					on:blur={validatePhone}
					class="w-full px-4 py-3 bg-[#0f172a]/50 border {telefonoError
						? 'border-red-500 focus:border-red-500'
						: 'border-gray-700 focus:border-vision-primary'} rounded-xl text-white focus:outline-none focus:ring-1 {telefonoError
						? 'focus:ring-red-500'
						: 'focus:ring-vision-primary'} transition-all placeholder-gray-600"
					placeholder="999999999"
					maxlength="9"
				/>
				{#if telefonoError}
					<p class="text-red-400 text-xs mt-1 ml-1">{telefonoError}</p>
				{/if}
			</div>

			<!-- CONTRASEÑA -->
			<div>
				<label class="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
					>Contraseña</label
				>
				<input
					type="password"
					bind:value={password}
					on:input={validatePassword}
					on:blur={validatePassword}
					class="w-full px-4 py-3 bg-[#0f172a]/50 border {passwordError
						? 'border-red-500 focus:border-red-500'
						: 'border-gray-700 focus:border-vision-primary'} rounded-xl text-white focus:outline-none focus:ring-1 {passwordError
						? 'focus:ring-red-500'
						: 'focus:ring-vision-primary'} transition-all placeholder-gray-600"
					placeholder="••••••••"
				/>
				{#if passwordError}
					<p class="text-red-400 text-xs mt-1 ml-1">{passwordError}</p>
				{/if}
			</div>

			<!-- BOTÓN DE ACCIÓN -->
			<!-- CORRECCIÓN: Usar !! para asegurar que las condiciones sean booleanas y TS no se queje -->
			<button
				type="submit"
				disabled={loading ||
					!!nombreError ||
					!!apellidoError ||
					!!emailError ||
					!!telefonoError ||
					!!passwordError ||
					!nombre ||
					!apellido ||
					!email ||
					!telefono ||
					!password}
				class="w-full py-3.5 mt-4 text-sm font-bold text-white uppercase tracking-wider bg-vision-primary rounded-xl shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:bg-blue-600 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
			>
				{loading ? 'Registrando...' : 'REGISTRARSE'}
			</button>
		</form>

		<div class="mt-8 text-center text-sm text-gray-500">
			¿Ya tienes cuenta?
			<a href="/login" class="text-vision-primary font-bold hover:underline">Inicia Sesión</a>
		</div>
	</div>
</div>
