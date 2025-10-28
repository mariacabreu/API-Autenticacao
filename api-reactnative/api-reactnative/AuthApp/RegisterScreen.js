import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";

const API_URL = "http://192.168.1.14:3000";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (email !== confirmEmail) {
      Alert.alert("Erro", "Emails não conferem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Sucesso", `Usuário cadastrado: ${JSON.stringify(data)}`);
        navigation.goBack();
      } else {
        Alert.alert("Erro", data.error || "Erro no cadastro");
      }
    } catch {
      Alert.alert("Erro", "Falha de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Confirmar Email" value={confirmEmail} onChangeText={setConfirmEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={[styles.button, { backgroundColor: "#007bff" }]} onPress={register}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 40 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 15 },
  button: { padding: 15, borderRadius: 8, width: "70%", alignItems: "center", marginBottom: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
