const axios = require('axios');

// URL base da API fornecida
const API_BASE_URL = 'https://api-react-5l3c.onrender.com';

// Dados para o novo usuário a ser registrado
const newUser = {
    email: `teste_${Date.now()}@app.com`, // Email único para evitar conflito
    password: 'minhaSenhaForte123'
};

// Credenciais do admin padrão para teste
const adminCredentials = {
    email: 'admin@local',
    password: 'adminpass'
};

async function testApi() {
    let userToken = null;
    let adminToken = null;

    console.log('--- 1. Testando Rota Pública (GET /public) ---');
    try {
        const publicResponse = await axios.get(`${API_BASE_URL}/public`);
        console.log('Sucesso - Rota Pública:', publicResponse.data);
    } catch (error) {
        console.error('Erro ao acessar rota pública:', error.message);
    }
    console.log('------------------------------------------------\n');


    console.log(`--- 2. Registrando Novo Usuário (${newUser.email}) (POST /register) ---`);
    try {
        const registerResponse = await axios.post(`${API_BASE_URL}/register`, newUser);
        console.log('Sucesso - Novo Usuário Cadastrado:', registerResponse.data);
    } catch (error) {
        console.error(`Erro ao registrar usuário. Pode ser que o email ${newUser.email} já exista se o teste for reexecutado sem mudar o email.`);
        // Se der erro no registro, prosseguimos para tentar logar com o admin
    }
    console.log('------------------------------------------------\n');


    console.log(`--- 3. Login do Novo Usuário (POST /login) ---`);
    try {
        const loginResponse = await axios.post(`${API_BASE_URL}/login`, newUser);
        userToken = loginResponse.data.token;
        console.log('Sucesso - Token do Novo Usuário obtido.');
        // console.log('Token:', userToken.substring(0, 30) + '...'); // Para não poluir o console
    } catch (error) {
        console.error('Erro ao fazer login com o novo usuário. Verifique se o registro funcionou corretamente.');
    }
    console.log('------------------------------------------------\n');


    if (userToken) {
        console.log('--- 4. Testando Rota Privada (GET /private) com Token de Usuário ---');
        try {
            const privateResponse = await axios.get(`${API_BASE_URL}/private`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });
            console.log('Sucesso - Rota Privada Acessada:', privateResponse.data);
        } catch (error) {
            console.error('Erro ao acessar rota privada:', error.response ? error.response.data : error.message);
        }
        console.log('------------------------------------------------\n');
    }


    console.log('--- 5. Obtendo Token do Admin Padrão (POST /login) ---');
    try {
        const adminLoginResponse = await axios.post(`${API_BASE_URL}/login`, adminCredentials);
        adminToken = adminLoginResponse.data.token;
        console.log('Sucesso - Token do Admin obtido.');
    } catch (error) {
        console.error('Erro ao fazer login com o Admin Padrão. Verifique a conexão com a API.');
    }
    console.log('------------------------------------------------\n');


    if (adminToken) {
        console.log('--- 6. Testando Rota Admin (GET /admin) com Token do Admin ---');
        try {
            const adminResponse = await axios.get(`${API_BASE_URL}/admin`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            console.log('Sucesso - Rota Admin Acessada:', adminResponse.data);
        } catch (error) {
            console.error('Erro ao acessar rota admin:', error.response ? error.response.data : error.message);
        }
        console.log('------------------------------------------------\n');

        console.log('--- 7. Testando Rota Admin (GET /admin) com Token de Usuário (Deve Falhar) ---');
        try {
            await axios.get(`${API_BASE_URL}/admin`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });
            console.log('ERRO ESPERADO: Usuário conseguiu acesso admin.');
        } catch (error) {
            console.log('Sucesso - Acesso Negado (Como Esperado):', error.response ? error.response.data : error.message);
        }
        console.log('------------------------------------------------\n');
    }
    
    // Exemplo de atualização (usando o token do novo usuário)
    if (userToken) {
        console.log(`--- 8. Atualizando dados do Usuário (${newUser.email}) (PATCH /me) ---`);
        const newEmail = `atualizado_${Date.now()}@app.com`;
        try {
            const updateResponse = await axios.patch(`${API_BASE_URL}/me`, {
                email: newEmail,
                password: newUser.password // Reutiliza a senha antiga como nova (só para demonstrar)
            }, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Sucesso - Usuário Atualizado:', updateResponse.data);
        } catch (error) {
            console.error('Erro ao atualizar dados do usuário:', error.response ? error.response.data : error.message);
        }
        console.log('------------------------------------------------\n');
    }
}

testApi();