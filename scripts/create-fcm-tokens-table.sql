-- Script para criar tabela de tokens FCM dos usuários
-- Creating FCM tokens table for user notification management

CREATE TABLE IF NOT EXISTS fcm_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    fcm_token TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{
        "conflicts": true,
        "reminders": true,
        "reminder_minutes": 15,
        "daily_summary": false
    }',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_email ON fcm_tokens(user_email);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active);

-- Função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar automaticamente o updated_at
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON fcm_tokens;
CREATE TRIGGER update_fcm_tokens_updated_at
    BEFORE UPDATE ON fcm_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_fcm_tokens_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE fcm_tokens IS 'Tabela para armazenar tokens FCM dos usuários para notificações push';
COMMENT ON COLUMN fcm_tokens.user_id IS 'ID único do usuário no Firebase Auth';
COMMENT ON COLUMN fcm_tokens.fcm_token IS 'Token FCM para envio de notificações push';
COMMENT ON COLUMN fcm_tokens.device_info IS 'Informações do dispositivo (navegador, OS, etc.)';
COMMENT ON COLUMN fcm_tokens.notification_preferences IS 'Preferências de notificação do usuário';
COMMENT ON COLUMN fcm_tokens.is_active IS 'Se o token está ativo e pode receber notificações';
