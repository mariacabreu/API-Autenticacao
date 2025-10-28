// App.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const API_URL = "http://192.168.1.14:3000"; // seu IP local da API

// ====== LOGIN / CADASTRO ======
function AuthScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmEmail) return alert("Preencha todos os campos");
    if (email !== confirmEmail) return alert("Emails não coincidem");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Erro no cadastro");
      else alert(`Usuário cadastrado: ${data.email}`);
    } catch (err) {
      console.log(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Preencha email e senha");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Login inválido");
      else {
        alert("Login realizado!");
        navigation.navigate("Home", { token: data.token, user: data.user });
      }
    } catch (err) {
      console.log(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login / Cadastro</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar Email (Cadastro)"
        value={confirmEmail}
        onChangeText={setConfirmEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: "#007bff" }]} onPress={handleRegister}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#28a745" }]} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

// ====== HOME ======
function HomeScreen({ route, navigation }) {
  const { token, user } = route.params;
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updateEmail, setUpdateEmail] = useState("");
  const [updatePassword, setUpdatePassword] = useState("");

  const getPublic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public`);
      const data = await res.json();
      setMessage(JSON.stringify(data));
    } catch (err) {
      console.log(err);
      setMessage("Erro na conexão");
    } finally {
      setLoading(false);
    }
  };

  const getPrivate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/private`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessage(JSON.stringify(data));
    } catch (err) {
      console.log(err);
      setMessage("Erro na conexão");
    } finally {
      setLoading(false);
    }
  };

  const getAdmin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessage(JSON.stringify(data));
    } catch (err) {
      console.log(err);
      setMessage("Erro na conexão");
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async () => {
    if (!updateEmail && !updatePassword) return alert("Preencha algo para atualizar");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: updateEmail || undefined, password: updatePassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Erro na atualização");
      else setMessage(JSON.stringify(data));
    } catch (err) {
      console.log(err);
      setMessage("Erro na conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bem-vindo, {user.email}</Text>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#17a2b8" }]} onPress={getPublic}>
        <Text style={styles.buttonText}>Consultar Rota Pública</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#ffc107" }]} onPress={getPrivate}>
        <Text style={styles.buttonText}>Consultar Rota Privada</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#dc3545" }]} onPress={getAdmin}>
        <Text style={styles.buttonText}>Consultar Admin</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>Atualizar Conta</Text>
      <TextInput
        style={styles.input}
        placeholder="Novo Email"
        value={updateEmail}
        onChangeText={setUpdateEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Nova Senha"
        value={updatePassword}
        onChangeText={setUpdatePassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: "#007bff" }]} onPress={updateAccount}>
        <Text style={styles.buttonText}>Atualizar Conta</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
      {message ? <Text style={{ marginTop: 20 }}>{message}</Text> : null}
    </ScrollView>
  );
}

// ====== NAVIGATION ======
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Autenticação" }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ====== STYLES ======
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
  button: { padding: 12, borderRadius: 8, width: "70%", alignItems: "center", marginBottom: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
