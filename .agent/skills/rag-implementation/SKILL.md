---
name: rag-implementation
description: Освойте Retrieval-Augmented Generation (RAG) для создания LLM-приложений, которые предоставляют точные, обоснованные ответы, используя внешние источники знаний.
license: MIT
---

# Реализация RAG

Освойте Retrieval-Augmented Generation (RAG) для создания LLM-приложений, которые предоставляют точные, обоснованные ответы, используя внешние источники знаний.

## Основные компоненты

### 1. Векторные базы данных
Цель: Эффективное хранение и извлечение векторных представлений (embeddings) документов
Варианты:
- Pinecone: Управляемая, масштабируемая, serverless
- Weaviate: С открытым исходным кодом, гибридный поиск, GraphQL
- Milvus: Высокая производительность, локальное развертывание (on-premise)
- Chroma: Легковесная, простая в использовании, для локальной разработки
- Qdrant: Быстрая, фильтрованный поиск, на Rust
- pgvector: Расширение PostgreSQL, интеграция с SQL

### 2. Встраивания (Embeddings)
Цель: Преобразование текста в числовые векторы для поиска по сходству
Модели (2026):

### 3. Стратегии поиска
Подходы:
- Плотный поиск (Dense Retrieval): Семантическое сходство через embeddings
- Разреженный поиск (Sparse Retrieval): Совпадение по ключевым словам (BM25, TF-IDF)
- Гибридный поиск: Комбинация плотного и разреженного поиска с взвешенным слиянием
- Мульти-запрос: Генерация нескольких вариантов запроса
- HyDE: Генерация гипотетических документов для лучшего поиска

### 4. Переранжирование (Reranking)
Цель: Улучшение качества поиска путем переупорядочивания результатов
Методы:
- Cross-Encoders: Переранжирование на основе BERT (ms-marco-MiniLM)
- Cohere Rerank: Переранжирование через API
- Maximal Marginal Relevance (MMR): Разнообразие + релевантность
- На основе LLM: Использование LLM для оценки релевантности

## Быстрый старт с LangGraph

```python
from langgraph.graph import StateGraph, START, END
from langchain_anthropic import ChatAnthropic
from langchain_voyageai import VoyageAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import TypedDict, Annotated

class RAGState(TypedDict):
    question: str
    context: list[Document]
    answer: str

# Инициализация компонентов
llm = ChatAnthropic(model="claude-sonnet-4-5")
embeddings = VoyageAIEmbeddings(model="voyage-3-large")
vectorstore = PineconeVectorStore(index_name="docs", embedding=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# Промпт для RAG
rag_prompt = ChatPromptTemplate.from_template(
    """Ответьте на основе контекста ниже. Если не можете ответить, скажите об этом.

Контекст: {context}

Вопрос: {question}

Ответ:"""
)

async def retrieve(state: RAGState) -> RAGState:
    """Извлечение релевантных документов."""
    docs = await retriever.ainvoke(state["question"])
    return {"context": docs}

async def generate(state: RAGState) -> RAGState:
    """Генерация ответа из контекста."""
    context_text = "\n\n".join(doc.page_content for doc in state["context"])
    messages = rag_prompt.format_messages(
        context=context_text,
        question=state["question"]
    )
    response = await llm.ainvoke(messages)
    return {"answer": response.content}

# Построение графа RAG
builder = StateGraph(RAGState)
builder.add_node("retrieve", retrieve)
builder.add_node("generate", generate)
builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "generate")
builder.add_edge("generate", END)

rag_chain = builder.compile()

# Использование
result = await rag_chain.ainvoke({"question": "Каковы основные функции?"})
print(result["answer"])
```

## Конфигурации векторных хранилищ

### Pinecone (Serverless)
```python
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore

# Инициализация клиента Pinecone
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

# Создание индекса, если необходимо
if "my-index" not in pc.list_indexes().names():
    pc.create_index(
        name="my-index",
        dimension=1024, # размерность voyage-3-large
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

# Создание векторного хранилища
index = pc.Index("my-index")
vectorstore = PineconeVectorStore(index=index, embedding=embeddings)
```

### Weaviate
```python
import weaviate
from langchain_weaviate import WeaviateVectorStore

client = weaviate.connect_to_local()
# или connect_to_weaviate_cloud()

vectorstore = WeaviateVectorStore(
    client=client,
    index_name="Documents",
    text_key="content",
    embedding=embeddings
)
```

### Chroma (Локальная разработка)
```python
from langchain_chroma import Chroma

vectorstore = Chroma(
    collection_name="my_collection",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)
```

### pgvector (PostgreSQL)
```python
from langchain_postgres.vectorstores import PGVector

connection_string = "postgresql+psycopg://user:pass@localhost:5432/vectordb"

vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="documents",
    connection=connection_string,
)
```

## Оптимизация поиска

### 1. Фильтрация по метаданным
```python
from langchain_core.documents import Document

# Добавление метаданных при индексации
docs_with_metadata = []
for doc in documents:
    doc.metadata.update({
        "source": doc.metadata.get("source", "unknown"),
        "category": determine_category(doc.page_content),
        "date": datetime.now().isoformat()
    })
    docs_with_metadata.append(doc)

# Фильтрация при поиске
results = await vectorstore.asimilarity_search(
    "query",
    filter={"category": "technical"},
    k=5
)
```

### 2. Maximal Marginal Relevance (MMR)
```python
# Баланс релевантности и разнообразия
results = await vectorstore.amax_marginal_relevance_search(
    "query",
    k=5,
    fetch_k=20, # Получить 20, вернуть 5 самых разнообразных
    lambda_mult=0.5 # 0=максимальное разнообразие, 1=максимальная релевантность
)
```

### 3. Переранжирование с Cross-Encoder
```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

async def retrieve_and_rerank(query: str, k: int = 5) -> list[Document]:
    # Получение начальных результатов
    candidates = await vectorstore.asimilarity_search(query, k=20)
    
    # Переранжирование
    pairs = [[query, doc.page_content] for doc in candidates]
    scores = reranker.predict(pairs)
    
    # Сортировка по оценке и выбор топ-k
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, score in ranked[:k]]
```

### 4. Cohere Rerank
```python
from langchain.retrievers import CohereRerank
from langchain_cohere import CohereRerank

reranker = CohereRerank(model="rerank-english-v3.0", top_n=5)

# Обернуть ретривер с переранжированием
reranked_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 20})
)
```
