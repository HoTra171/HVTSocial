-- Migration: Create call_history table
-- Created: 2026-01-10
-- Purpose: Store call history (video/voice) with duration and status

CREATE TABLE call_history (
  id INT IDENTITY(1,1) PRIMARY KEY,
  caller_id INT NOT NULL,
  receiver_id INT NOT NULL,
  call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('video', 'voice')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'missed', 'rejected', 'failed')),
  duration INT DEFAULT 0, -- Duration in seconds (0 for missed/rejected)
  started_at DATETIME2 DEFAULT GETDATE(),
  ended_at DATETIME2,
  created_at DATETIME2 DEFAULT GETDATE(),

  CONSTRAINT FK_call_history_caller FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE NO ACTION,
  CONSTRAINT FK_call_history_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE NO ACTION
);

-- Indexes for better query performance
CREATE INDEX idx_call_history_caller ON call_history(caller_id);
CREATE INDEX idx_call_history_receiver ON call_history(receiver_id);
CREATE INDEX idx_call_history_created_at ON call_history(created_at DESC);
CREATE INDEX idx_call_history_both_users ON call_history(caller_id, receiver_id);

-- Comments
EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'Stores call history for video and voice calls',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'call_history';

EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'Type of call: video or voice',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'call_history',
  @level2type = N'COLUMN', @level2name = N'call_type';

EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'Call status: completed (answered and ended), missed (not answered), rejected (declined), failed (error)',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'call_history',
  @level2type = N'COLUMN', @level2name = N'status';

EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'Call duration in seconds (0 for missed/rejected calls)',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'call_history',
  @level2type = N'COLUMN', @level2name = N'duration';
