# Saída de Produto

## Caminho feliz

Feature: Criação de saída de produto

  Scenario: Saída criada com sucesso
    Given que existe um produto com estoque disponível
    When navego para a tela de nova saída
    And preencho os dados da saída com o barcode do produto e uma quantidade menor ou igual ao estoque
    And solicito a criação da saída
    Then devo ver os detalhes da saída criada
    And o estoque do produto deve estar atualizado na saída

## Caminho com erro

  Scenario: Erro ao criar a saída quando a quantidade é maior que o estoque
    Given que existe um produto com estoque disponível
    When navego para a tela de nova saída
    And preencho os dados da saída com o barcode do produto e uma quantidade maior que o estoque
    And solicito a criação da saída
    Then devo ver a mensagem de erro de estoque insuficiente
