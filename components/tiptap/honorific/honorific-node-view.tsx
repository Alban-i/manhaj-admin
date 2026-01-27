'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';

const svgCache: Record<string, string> = {};

interface HonorificNodeViewProps {
  node: {
    attrs: {
      honorificType: string;
    };
  };
}

export function HonorificNodeView({ node }: HonorificNodeViewProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const type = node.attrs.honorificType;

  useEffect(() => {
    if (!type) return;
    if (svgCache[type]) {
      setSvg(svgCache[type]);
      return;
    }
    fetch(`/calligraphy/${type}.svg`)
      .then(res => res.text())
      .then(text => {
        svgCache[type] = text;
        setSvg(text);
      })
      .catch(() => {
        setSvg('');
      });
  }, [type]);

  return (
    <NodeViewWrapper
      as="span"
      className="inline relative -top-1 [&>svg]:h-5 [&>svg]:w-auto [&>svg]:inline"
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
