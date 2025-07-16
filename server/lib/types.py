from typing import Optional, TypeAlias, Literal, TypedDict
from lib.datamodels import File, StructuredForm

Folders: TypeAlias = dict[str, list[File]]
InputType: TypeAlias = Literal["form", "freeform"]
InputDataType: TypeAlias = StructuredForm | str


class HistoryRecordDict(TypedDict):
    id: Optional[str] = None
    user_id: str
    name: str
    input_type: InputType
    input: InputDataType
    output: Folders
    created_at: str

    def validate_input(d: "HistoryRecordDict") -> None:
        if d["input_type"] == "form" and not isinstance(d["input"], StructuredForm):
            raise ValueError("Input must be a StructuredForm when input_type is 'form'")
        if d["input_type"] == "freeform" and not isinstance(d["input"], str):
            raise ValueError("Input must be a string when input_type is 'freeform'")
