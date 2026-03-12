from enum import Enum


class SearchEngineType(str, Enum):
    POSTGRES = "postgres"
    TYPESENSE = "typesense"