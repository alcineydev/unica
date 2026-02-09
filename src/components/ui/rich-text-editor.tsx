'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
    Link as LinkIcon, Undo, Redo, Minus, Quote, RemoveFormatting
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Comece a escrever...', className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose max-w-none min-h-[300px] p-4 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    })

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!editor) return null

    const addLink = () => {
        const url = window.prompt('URL do link:')
        if (url) editor.chain().focus().setLink({ href: url }).run()
    }

    return (
        <div className={cn('border rounded-lg overflow-hidden', className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
                <Toggle size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <Undo className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <Redo className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    <Heading3 className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}>
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}>
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}>
                    <AlignRight className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <Minus className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" pressed={editor.isActive('link')} onPressedChange={addLink}>
                    <LinkIcon className="h-4 w-4" />
                </Toggle>
                <Toggle size="sm" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                    <RemoveFormatting className="h-4 w-4" />
                </Toggle>
            </div>

            <EditorContent editor={editor} />
        </div>
    )
}
