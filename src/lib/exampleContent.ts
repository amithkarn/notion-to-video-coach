// Newton's III Laws of Motion - example TipTap JSON content
export const newtonsLawsContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: "Newton's Three Laws of Motion" }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "Sir Isaac Newton formulated three fundamental laws that describe the relationship between the motion of an object and the forces acting on it. These laws laid the foundation for classical mechanics.",
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: "First Law — Law of Inertia" }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by a net external force.",
        },
      ],
    },
    {
      type: 'mathBlock',
      attrs: { latex: '\\sum \\vec{F} = 0 \\implies \\frac{d\\vec{v}}{dt} = 0' },
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: "Second Law — Force and Acceleration" }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.",
        },
      ],
    },
    {
      type: 'mathBlock',
      attrs: { latex: '\\vec{F} = m \\vec{a}' },
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "Where F is force measured in Newtons (N), m is mass in kilograms (kg), and a is acceleration in metres per second squared (m/s²).",
        },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: "Third Law — Action and Reaction" }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: "For every action, there is an equal and opposite reaction. When one body exerts a force on a second body, the second body simultaneously exerts a force equal in magnitude and opposite in direction on the first body.",
        },
      ],
    },
    {
      type: 'mathBlock',
      attrs: { latex: '\\vec{F}_{12} = -\\vec{F}_{21}' },
    },
  ],
};
