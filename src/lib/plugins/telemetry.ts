import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { Resource } from 'sst'

export const telemetry = () => {
  return opentelemetry({
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: 'https://api.axiom.co/v1/traces',
          headers: {
            Authorization: `Bearer ${Resource.AxiomToken.value}`,
            'X-Axiom-Dataset': Resource.AxiomDataset.value,
          },
        })
      ),
    ],
  })
}
