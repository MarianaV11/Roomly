from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, TypeAdapter


class CallTarget(BaseModel):
    conversation_id: int


class CallSignalData(CallTarget):
    to: int
    # SDP offer/answer or ICE candidate, relayed as is.
    payload: dict[str, Any]


class CallJoin(BaseModel):
    type: Literal["call_join"]
    data: CallTarget


class CallLeave(BaseModel):
    type: Literal["call_leave"]
    data: CallTarget


class CallSignal(BaseModel):
    type: Literal["call_signal"]
    data: CallSignalData


ClientEvent = TypeAdapter(
    Annotated[CallJoin | CallLeave | CallSignal, Field(discriminator="type")]
)


class CallState(BaseModel):
    conversation_id: int
    participant_ids: list[int]
