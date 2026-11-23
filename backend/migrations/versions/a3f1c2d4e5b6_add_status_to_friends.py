"""friend requests: status column, one row per pair

Revision ID: a3f1c2d4e5b6
Revises: dff90e8a69d1
Create Date: 2026-11-23 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f1c2d4e5b6'
down_revision: Union[str, Sequence[str], None] = 'dff90e8a69d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rows from before requests existed count as accepted friendships.
    op.add_column('friends', sa.Column('status', sa.String(length=16), server_default='accepted', nullable=False))
    op.alter_column('friends', 'status', server_default='pending')

    # Keep a single row per pair (in either direction) before enforcing it.
    op.execute(
        """
        DELETE FROM friends f USING friends g
        WHERE least(f.user_id, f.friend_id) = least(g.user_id, g.friend_id)
          AND greatest(f.user_id, f.friend_id) = greatest(g.user_id, g.friend_id)
          AND f.id > g.id
        """
    )
    op.execute("DELETE FROM friends WHERE user_id = friend_id")

    op.create_check_constraint('ck_friends_not_self', 'friends', 'user_id <> friend_id')
    op.create_check_constraint('ck_friends_status', 'friends', "status IN ('pending', 'accepted')")
    op.create_index(
        'uq_friends_pair',
        'friends',
        [sa.text('least(user_id, friend_id)'), sa.text('greatest(user_id, friend_id)')],
        unique=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('uq_friends_pair', table_name='friends')
    op.drop_constraint('ck_friends_status', 'friends', type_='check')
    op.drop_constraint('ck_friends_not_self', 'friends', type_='check')
    op.execute("DELETE FROM friends WHERE status = 'pending'")
    op.drop_column('friends', 'status')
