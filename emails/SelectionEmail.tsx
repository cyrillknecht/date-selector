import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

type CardAnswer = {
  type: 'decision'
  prompt: string
  cards: { title: string; location?: string | null; price_range?: string | null; mood_tags: string[] }[]
}

type QuizAnswer = {
  type: 'quiz'
  title: string
  answers: { question: string; answer: string }[]
}

type ModuleAnswer = CardAnswer | QuizAnswer

interface SelectionEmailProps {
  flowTitle: string
  message: string | null
  answers: ModuleAnswer[]
}

export function SelectionEmail({ flowTitle, message, answers }: SelectionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>She made her picks for {flowTitle}!</Preview>
      <Body style={{ backgroundColor: '#faf9f7', fontFamily: 'Georgia, serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ fontSize: 28, color: '#1f1a18', margin: '0 0 8px', fontWeight: 600 }}>
            She chose! 💕
          </Heading>
          <Text style={{ fontSize: 15, color: '#7d6b5d', margin: '0 0 32px' }}>
            Here are her picks for <strong>{flowTitle}</strong>
          </Text>

          {answers.map((answer, i) => (
            <Section key={i} style={{ marginBottom: 28 }}>
              {answer.type === 'decision' ? (
                <>
                  <Text style={{ fontSize: 12, color: '#9c8878', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                    {answer.prompt}
                  </Text>
                  {answer.cards.map((card, j) => (
                    <Section key={j} style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '14px 18px', marginBottom: 8, border: '1px solid #e8e2d9' }}>
                      <Text style={{ fontSize: 16, fontWeight: 600, color: '#1f1a18', margin: '0 0 4px' }}>
                        {card.title}
                      </Text>
                      {card.location && (
                        <Text style={{ fontSize: 13, color: '#7d6b5d', margin: '0 0 4px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                          📍 {card.location}
                        </Text>
                      )}
                      {card.price_range && (
                        <Text style={{ fontSize: 13, color: '#7d6b5d', margin: '0 0 4px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                          💰 {card.price_range}
                        </Text>
                      )}
                      {card.mood_tags.length > 0 && (
                        <Text style={{ fontSize: 12, color: '#9c8878', margin: 0, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                          {card.mood_tags.join(' · ')}
                        </Text>
                      )}
                    </Section>
                  ))}
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 12, color: '#9c8878', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                    {answer.title}
                  </Text>
                  {answer.answers.map((qa, j) => (
                    <Section key={j} style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '14px 18px', marginBottom: 8, border: '1px solid #e8e2d9' }}>
                      <Text style={{ fontSize: 13, color: '#7d6b5d', margin: '0 0 4px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                        {qa.question}
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: 600, color: '#1f1a18', margin: 0 }}>
                        {qa.answer}
                      </Text>
                    </Section>
                  ))}
                </>
              )}
            </Section>
          ))}

          {message && (
            <>
              <Hr style={{ borderColor: '#e8e2d9', margin: '24px 0' }} />
              <Section style={{ backgroundColor: '#fff5f5', borderRadius: 12, padding: '16px 20px', border: '1px solid #ffc9c9' }}>
                <Text style={{ fontSize: 13, color: '#9c8878', margin: '0 0 6px', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                  Her message
                </Text>
                <Text style={{ fontSize: 15, color: '#1f1a18', margin: 0, fontStyle: 'italic' }}>
                  &ldquo;{message}&rdquo;
                </Text>
              </Section>
            </>
          )}

          <Hr style={{ borderColor: '#e8e2d9', margin: '32px 0 24px' }} />
          <Text style={{ fontSize: 12, color: '#b8a899', textAlign: 'center', margin: 0, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
            Sent with love via Date Night Selector
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
