import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Read-only value with a copy-to-clipboard button, for one-time secrets. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success('Copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='grid gap-2'>
      <Label>{label}</Label>
      <div className='flex gap-2'>
        <Input readOnly value={value} className='font-mono' />
        <Button type='button' variant='outline' size='icon' onClick={copy}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  )
}
