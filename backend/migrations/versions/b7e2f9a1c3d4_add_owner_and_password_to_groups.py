"""add owner and password to groups

Revision ID: b7e2f9a1c3d4
Revises: a3f1c2d4e5b6
Create Date: 2026-11-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7e2f9a1c3d4'
down_revision: Union[str, Sequence[str], None] = 'a3f1c2d4e5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('conversations', sa.Column('owner_id', sa.Integer(), nullable=True))
    op.add_column('conversations', sa.Column('password_hash', sa.String(), nullable=True))
    op.create_foreign_key(
        'conversations_owner_id_fkey', 'conversations', 'users', ['owner_id'], ['id'], ondelete='SET NULL'
    )

    # The creator was never stored: existing groups go to the member with the lowest id.
    op.execute(
        """
        UPDATE conversations c SET owner_id = (
            SELECT min(m.user_id) FROM conversation_members m WHERE m.conversation_id = c.id
        )
        WHERE c.is_group = true
        """
    )


def downgrade() -> None:
    op.drop_constraint('conversations_owner_id_fkey', 'conversations', type_='foreignkey')
    op.drop_column('conversations', 'password_hash')
    op.drop_column('conversations', 'owner_id')
