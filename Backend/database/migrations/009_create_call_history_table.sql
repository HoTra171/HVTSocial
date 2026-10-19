CREATE TABLE IF NOT EXISTS call_history (
    id SERIAL PRIMARY KEY,
    caller_id INT NOT NULL,
    receiver_id INT NOT NULL,
    call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('video', 'voice')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'missed', 'rejected', 'failed', 'busy')),
    duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_call_history_caller ON call_history(caller_id);
CREATE INDEX idx_call_history_receiver ON call_history(receiver_id);
