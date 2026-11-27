FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
RUN useradd --create-home --uid 10001 sila && chown -R sila /app
USER sila
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import os,urllib.request;urllib.request.urlopen('http://localhost:'+os.environ.get('PORT','8000')+'/api/health')" || exit 1
# SEED_ON_START=1 uniquement en démo locale. En production : ne jamais mettre 1.
CMD ["sh", "-c", "if [ \"$SEED_ON_START\" = \"1\" ]; then python -m app.seed; fi; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
