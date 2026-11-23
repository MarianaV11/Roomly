"""add is_group flag to conversations

Revision ID: dff90e8a69d1
Revises: d59bb0e9ca12
Create Date: 2026-11-23 15:21:04.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dff90e8a69d1'
down_revision: Union[str, Sequence[str], None] = 'd59bb0e9ca12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('conversations', sa.Column('is_group', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.create_index(op.f('ix_conversations_is_group'), 'conversations', ['is_group'], unique=False)

    # Existing conversations: before this flag, "group" meant a name or more than 2 members.
    op.execute(
        """
        UPDATE conversations c SET is_group = true
        WHERE c.name IS NOT NULL
           OR (SELECT count(*) FROM conversation_members m WHERE m.conversation_id = c.id) > 2
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_conversations_is_group'), table_name='conversations')
    op.drop_column('conversations', 'is_group')
