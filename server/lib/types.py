from typing import Optional, TypeAlias, Literal
from typing_extensions import TypedDict
from lib.datamodels import File, StructuredForm, CustomFileTypes

Folders: TypeAlias = dict[str, list[File]]
InputType: TypeAlias = Literal["form", "freeform"]
InputDataType: TypeAlias = StructuredForm | str
APIError: TypeAlias = dict[Literal["error"], str]


class HistoryRecordDict(TypedDict):
    id: Optional[str] = None
    user_id: str
    name: str
    created_at: str
    input_type: InputType
    input: InputDataType
    output: Folders
    file_types: CustomFileTypes

    def validate_input(d: "HistoryRecordDict") -> None:
        if d["input_type"] == "form" and not _is_structured_form_input(d["input"]):
            raise ValueError(
                "Input must include curriculum, grade, subject, and topics when input_type is 'form'"
            )
        if d["input_type"] == "freeform" and not isinstance(d["input"], str):
            raise ValueError("Input must be a string when input_type is 'freeform'")


def _is_structured_form_input(value: object) -> bool:
    if isinstance(value, StructuredForm):
        return True

    if not isinstance(value, dict):
        return False

    return (
        isinstance(value.get("curriculum"), str)
        and isinstance(value.get("grade"), int)
        and isinstance(value.get("subject"), str)
        and isinstance(value.get("topics"), list)
        and all(isinstance(topic, str) for topic in value["topics"])
    )
