import { Box, Link, Text } from '@chakra-ui/react';
import React from 'react';
import { TextSelection } from '@tiptap/pm/state';
import { useNavigate } from 'react-router-dom';

const ToCItem = ({ item, onItemClick }) => {
  return (
    <Box style={{ paddingLeft: '0.5em' }}>
      <Box className="toc-item-box" style={{ '--level': item.level }}>
        <Link
          href={`#${item.id}`}
          onClick={e => onItemClick(e, item.id)}
          style={{ color: 'gray' }}
        >
          {item.textContent}
        </Link>
      </Box>
    </Box>
  );
};

const ToCEmptyState = () => {
  return (
    <Text style={{ paddingLeft: '0.5em', color: 'gray', fontSize: 'small' }}>
      見出しを設定すると表示されます
    </Text>
  );
};

const ToC = ({ tocItems, editor }) => {
  const history = useNavigate();

  const onItemClick = (e, id) => {
    e.preventDefault();

    if (editor) {
      const element = document.getElementById(id);
      const pos = editor.view.posAtDOM(element, 0);

      // set focus
      const tr = editor.view.state.tr;

      tr.setSelection(new TextSelection(tr.doc.resolve(pos)));

      editor.view.dispatch(tr);

      editor.view.focus();

      if (history.pushState) {
        // eslint-disable-line
        history.pushState(null, null, `#${id}`); // eslint-disable-line
      }

      element.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <Text padding="0.5em" fontWeight="bold">
        Table of Contents
      </Text>
      {tocItems.length === 0 ? (
        <ToCEmptyState />
      ) : (
        tocItems.map(item => (
          <ToCItem onItemClick={onItemClick} key={item.id} item={item} />
        ))
      )}
    </>
  );
};

export default ToC;
