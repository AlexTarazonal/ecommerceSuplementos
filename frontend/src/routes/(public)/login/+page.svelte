<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { setCartUser } from '$lib/cart'; // 👈 NUEVO: conectar login con carrito

	let email = '';
	let password = '';
	let errorMessage = '';
	let loading = false;

	// Variables para mensajes de validación en tiempo real
	let emailError = '';
	let passwordError = '';

	onMount(() => {
		const token = localStorage.getItem('token');
		const rawUser = localStorage.getItem('usuario');

		// 🔹 Sincronizar carrito con el usuario que ya está guardado (si lo hay)
		if (rawUser) {
			try {
				const user = JSON.parse(rawUser);
				// Cambia "user.id" si tu backend usa otro nombre para el ID
				setCartUser(user.id);
			} catch (e) {
				console.error('Error parsing usuario from localStorage', e);
				setCartUser(null); // guest
			}
		} else {
			setCartUser(null); // guest / sin sesión
		}

		if (token) {
			// Si quisieras redirigir automáticamente a la tienda, descomenta:
			// goto('/tienda');
		}
	});

	// --- VALIDACIÓN DE CORREO ---
	function validateEmail() {
		emailError = '';

		// 1. Eliminar espacios automáticamente
		email = email.trim().replace(/\s/g, '');

		if (!email) {
			emailError = 'El correo es obligatorio.';
			return false;
		}

		if (email.length < 5) {
			// a@b.c mínimo 5 chars
			emailError = 'El correo es muy corto.';
			return false;
		}

		if (!/[a-zA-Z]/.test(email)) {
			emailError = 'El correo debe contener al menos una letra.';
			return false;
		}

		const localPart = email.slice(0, -10);

		if (localPart.length < 3) {
			emailError = 'Mínimo 3 caracteres antes del @.';
			return false;
		}

		// Regex estricto para validar estructura de correo
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		if (!emailRegex.test(email)) {
			emailError = 'Formato de correo inválido (ej: usuario@dominio.com).';
			return false;
		}

		return true;
	}

	// --- VALIDACIÓN DE CONTRASEÑA ---
	function validatePassword() {
		passwordError = '';

		// 1. Eliminar espacios automáticamente
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

		// Debe contener al menos una letra (no solo símbolos/números)
		if (!/[a-zA-Z]/.test(password)) {
			passwordError = 'Debe contener al menos una letra.';
			return false;
		}

		// Verificar caracteres extraños (solo permite ASCII estándar)
		if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
			passwordError = 'Contiene caracteres no permitidos.';
			return false;
		}

		return true;
	}

	async function handleLogin() {
		// Ejecutar validaciones antes de enviar
		const isEmailValid = validateEmail();
		const isPasswordValid = validatePassword();

		if (!isEmailValid || !isPasswordValid) {
			return; // Detener si hay errores
		}

		loading = true;
		errorMessage = '';

		try {
			const response = await fetch('http://localhost:4000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem('token', data.token);
				localStorage.setItem('usuario', JSON.stringify(data.user));

			
				setCartUser(data.user.id);

				if (data.user.rol === 'admin') {
					window.location.href = '/admin/dashboard';
				} else {
					window.location.href = '/tienda';
				}
			} else {
				errorMessage = data.message || 'Credenciales incorrectas';
			}
		} catch (error) {
			errorMessage = 'Error al conectar con el servidor';
			console.error(error);
		} finally {
			loading = false;
		}
	}
</script>


<div class="flex items-center justify-center min-h-screen w-full px-4">
	<div
		class="relative w-full max-w-md p-8 rounded-3xl border border-white/10 bg-vision-card backdrop-blur-xl shadow-2xl"
	>
		<div
			class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-vision-primary rounded-2xl shadow-[0_0_40px_rgba(0,117,255,0.6)] flex items-center justify-center"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="w-10 h-10 text-white"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
		</div>

		<div class="mt-8 text-center">
			<h2 class="text-3xl font-bold text-white mb-2">Bienvenido</h2>
			<p class="text-gray-400 text-sm">Ingresa tus credenciales para acceder</p>
		</div>

		{#if errorMessage}
			<div
				class="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center animate-pulse"
			>
				{errorMessage}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="mt-8 space-y-6">
			<!-- CAMPO CORREO -->
			<div class="group">
				<label class="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
					>Correo Electrónico</label
				>
				<div class="relative">
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
				</div>
				{#if emailError}
					<p class="text-red-400 text-xs mt-1 ml-1">{emailError}</p>
				{/if}
			</div>

			<!-- CAMPO CONTRASEÑA -->
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

			<button
				type="submit"
				disabled={loading ||
					emailError !== '' ||
					passwordError !== '' ||
					email === '' ||
					password === ''}
				class="w-full py-3.5 mt-4 text-sm font-bold text-white uppercase tracking-wider bg-vision-primary rounded-xl shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:bg-blue-600 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
			>
				{loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
			</button>

			<div class="flex items-center justify-between mt-4 text-sm text-gray-400">
				<label class="flex items-center cursor-pointer hover:text-white">
					<input
						type="checkbox"
						class="mr-2 rounded bg-gray-800 border-gray-700 text-vision-primary focus:ring-0"
					/>
					Recordarme
				</label>
				<a href="#" class="hover:text-vision-primary transition-colors">¿Olvidaste tu contraseña?</a
				>
			</div>
		</form>

		<div class="mt-8 text-center text-sm text-gray-500">
			¿No tienes cuenta?
			<a href="/register" class="text-vision-primary font-bold hover:underline">Regístrate aquí</a>
		</div>
	</div>
</div>
